import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FixedSlot } from '@prisma/client';

export interface PublicSlot {
  startTime: string;
  status: string;
}

export interface CreateFixedSlotDto {
  courtId?: number | string;
  dayOfWeek: number | string;
  startTime: string;
  endTime: string;
  clientName: string;
  startDate: string;
  endDate?: string | null;
}

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  // 1. Obtener turnos para un día específico y cancha (Lazy Generation)
  async getSlotsForDate(dateStr: string, courtId: number = 1) {
    const date = new Date(dateStr);

    // Verificar si YA existen turnos para esa fecha lógica y cancha
    // "Fecha lógica" incluye el día actual completo Y la madrugada del siguiente (00:00, 01:00)

    // Verificación robusta: Si faltan horarios (ej: migración de horario viejo a nuevo), regenerar/completar.
    const expectedRegularHours = 15; // 09:00 a 23:00

    // Contar slots principales
    const countMain = await this.prisma.appointment.count({
      where: {
        date: { equals: date },
        courtId: courtId,
        startTime: { gte: '09:00' },
      },
    });

    // Contar slots madrugada (del día lógico siguiente)
    const nextDateForCount = new Date(date);
    nextDateForCount.setDate(nextDateForCount.getDate() + 1);

    const countNight = await this.prisma.appointment.count({
      where: {
        date: { equals: nextDateForCount },
        courtId: courtId,
        startTime: { in: ['00:00', '01:00'] },
      },
    });

    // Si falta alguno en cualquier tramo, ejecutamos la generación (que es segura/idempotente)
    if (countMain < expectedRegularHours || countNight < 2) {
      console.log(
        `Incomplete slots for ${dateStr} Court ${courtId} (Main: ${countMain}, Night: ${countNight}). Filling gaps...`,
      );
      await this.generateDaySlots(date, courtId);
    }

    // Recuperar (Día actual) Y (Día siguiente si hora < 09:00, específicamente 00,01)
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const slotsToday = await this.prisma.appointment.findMany({
      where: {
        date: { equals: date },
        courtId: courtId,
        startTime: { gte: '09:00' }, // Por si acaso hubiera basura vieja
      },
      orderBy: { startTime: 'asc' },
    });

    const slotsTonight = await this.prisma.appointment.findMany({
      where: {
        date: { equals: nextDate },
        courtId: courtId,
        startTime: { in: ['00:00', '01:00'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Combinar: Hoy + Madrugada
    // El orden visual será: 09...23, luego 00, 01
    return [...slotsToday, ...slotsTonight];
  }

  // 2. Obtener vista pública (Agregada)
  async getPublicSlots(dateStr: string): Promise<PublicSlot[]> {
    // Forzamos la generación/obtención de ambas canchas
    const slots1 = await this.getSlotsForDate(dateStr, 1);
    const slots2 = await this.getSlotsForDate(dateStr, 2);

    // Map de tiempos
    const timeMap = new Map<string, string>();

    // Inicializar con Cancha 1
    slots1.forEach((s) => {
      timeMap.set(s.startTime, s.status);
    });

    // Comparar con Cancha 2
    // Lógica: Si Cancha 2 está LIBRE, el horario es LIBRE (aunque C1 esté ocupada)
    // Si Cancha 2 está OCUPADA, mantenemos lo que diga C1 (Si C1 libre -> libre, si C1 ocupada -> ocupada)
    slots2.forEach((s) => {
      if (s.status === 'AVAILABLE') {
        timeMap.set(s.startTime, 'AVAILABLE');
      }
      // Si s.status != AVAILABLE, no hacemos nada, nos quedamos con el status de C1
      // (Que si era AVAILABLE, sigue siendolo. Si era BOOKED, ambos son BOOKED).
    });

    // Convertir a array
    const publicSlots: PublicSlot[] = [];
    timeMap.forEach((status, time) => {
      publicSlots.push({ startTime: time, status });
    });

    // Ordenar: 09..23, 00..01
    // Hack simple: Tratar 00 y 01 como 24 y 25 para ordenar
    return publicSlots.sort((a, b) => {
      const getVal = (t: string) => {
        const h = parseInt(t.split(':')[0], 10);
        return h < 5 ? h + 24 : h; // Madrugada va al final
      };
      return getVal(a.startTime) - getVal(b.startTime);
    });
  }

  // 3. Crear Turno Fijo y aplicar a futuros ya generados
  async createFixedSlot(data: CreateFixedSlotDto) {
    const courtId = Number(data.courtId || 1);
    const dayOfWeek = Number(data.dayOfWeek);
    console.log(
      `[CreateFixed] Request for Day ${dayOfWeek}, Time ${data.startTime}, Court ${courtId}`,
    );

    const created = await this.prisma.fixedSlot.create({
      data: {
        dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        clientName: data.clientName,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        courtId,
      },
    });

    // Actualizar Appointments futuros que YA existan y coincidan
    const searchDate = new Date();
    searchDate.setHours(0, 0, 0, 0);
    searchDate.setDate(searchDate.getDate() - 1); // Retroceder un día para evitar problemas de timezone con "Hoy"

    const candidates = await this.prisma.appointment.findMany({
      where: {
        courtId: courtId,
        startTime: data.startTime,
        date: { gte: searchDate }, // Desde ayer, el filtro de JS se encargará de seleccionar los correctos
      },
    });

    console.log(
      `[CreateFixed] Found ${candidates.length} future candidates matching time.`,
    );

    const idsToUpdate = candidates
      .filter((app) => {
        // FORZAR interpretacion correcta del dia:
        const dStr = app.date.toISOString().split('T')[0];
        const dObj = new Date(dStr + 'T12:00:00');

        let d = dObj.getDay();
        if (d === 0) d = 7;

        const match = d === dayOfWeek;
        // Loguear solo para debug si falla
        if (!match && candidates.length < 50) {
          // console.log(`[Debug] Candidate ${dStr} is Day ${d}, expected ${dayOfWeek}. Match? ${match}`);
        }
        return match;
      })
      .map((app) => app.id);

    console.log(
      `[CreateFixed] Identified ${idsToUpdate.length} slots to update to FIXED.`,
    );

    if (idsToUpdate.length > 0) {
      await this.prisma.appointment.updateMany({
        where: { id: { in: idsToUpdate } },
        data: {
          status: 'FIXED',
          type: 'FIXED',
          clientName: data.clientName,
          clientPhone: 'FIXED_SLOT',
        },
      });
    }

    return created;
  }

  // Helper local para obtener dia robusto
  private getDayOfWeekRobust(date: Date): number {
    const dStr = date.toISOString().split('T')[0];
    const dObj = new Date(dStr + 'T12:00:00');
    const d = dObj.getDay();
    return d === 0 ? 7 : d;
  }

  // Helper para generar un solo día (Lógico)
  private async generateDaySlots(logicalDate: Date, courtId: number) {
    const regularHours = [
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
      '23:00',
    ];
    const lateHours = ['00:00', '01:00'];

    // Usar el helper robusto
    const dayOfWeek = this.getDayOfWeekRobust(logicalDate);

    const fixedSlots = await this.prisma.fixedSlot.findMany({
      where: { dayOfWeek, courtId },
    });

    // Generar Horas Regulares
    for (const time of regularHours) {
      await this.createSlotIfNotExists(logicalDate, time, courtId, fixedSlots);
    }

    // Generar Horas Madrugada (Fecha física = logical + 1)
    // IMPORTANTE: NO Recalcular dayOfWeek para la madrugada, siguen siendo "fijos del Lunes" aunque sean Martes 00:00
    const nextDay = new Date(logicalDate);
    nextDay.setDate(nextDay.getDate() + 1);

    for (const time of lateHours) {
      await this.createSlotIfNotExists(nextDay, time, courtId, fixedSlots);
    }
  }

  private async createSlotIfNotExists(
    date: Date,
    time: string,
    courtId: number,
    fixedSlots: FixedSlot[],
  ) {
    const existing = await this.prisma.appointment.findFirst({
      where: { date: date, startTime: time, courtId: courtId },
    });

    if (existing) return;

    const fixed = fixedSlots.find((f) => f.startTime === time);

    const endTime = this.calculateEndTime(time);

    if (fixed) {
      await this.prisma.appointment.create({
        data: {
          date: date,
          startTime: time,
          endTime: endTime,
          status: 'FIXED',
          type: 'FIXED',
          clientName: fixed.clientName,
          clientPhone: 'FIXED_SLOT',
          courtId: courtId,
        },
      });
    } else {
      await this.prisma.appointment.create({
        data: {
          date: date,
          startTime: time,
          endTime: endTime,
          status: 'AVAILABLE',
          type: 'NORMAL',
          courtId: courtId,
        },
      });
    }
  }

  private calculateEndTime(startTime: string): string {
    const [hour, min] = startTime.split(':').map(Number);
    let endHour = hour + 1;
    if (endHour === 24) endHour = 0; // 23:00 -> 00:00
    // si es 00 -> 01, si es 01 -> 02
    return `${endHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }

  // 4. Reservar/Actualizar Turno
  async updateSlotStatus(
    id: number,
    status: string,
    clientName?: string,
    type?: string,
  ) {
    const data: { status: string; clientName?: string; type?: string } = {
      status,
      clientName,
    };
    if (type) data.type = type;

    return this.prisma.appointment.update({
      where: { id },
      data,
    });
  }

  // 5. Generar manual (opcional, itera canchas)
  async generateSlots(startDateStr: string, endDateStr: string) {
    // Como ahora es lazy, simplemente podríamos no hacer nada o forzar la generación.
    // Si el usuario quiere "pre-generar", iteramos.
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      await this.generateDaySlots(new Date(d), 1);
      await this.generateDaySlots(new Date(d), 2);
    }
    return { message: 'Turnos generados correctamente' };
  }
}

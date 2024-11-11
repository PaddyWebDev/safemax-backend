// src/functions/validate-appointment.ts
import { Appointment } from "@prisma/client";
import prisma from "../prisma";
import { startOfWeek, endOfWeek, format } from "date-fns";

interface slotsByDay {
  [key: string]: string[];
} // This ensures that slotsByDay has keys of type string and values of type string[]

// Function to check if an appointment already exists for the given date and time
export async function checkIfTheSlotISBooked(dateTime: Date): Promise<Boolean> {
  const appointments = await prisma.appointment.findFirst({
    where: {
      dateTime: dateTime, // Assuming dateTime is in ISO string format
    },
  });
  return appointments ? true : false;
}

export async function findAppointmentById(
  appointmentId: number
): Promise<Appointment | null> {
  return await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
  });
}

export async function checkIfTheAppointmentExist(
  email: string,
  time: Date
): Promise<Boolean> {
  return !!(await prisma.appointment.findFirst({
    where: {
      email: email,
      dateTime: time,
    },
  }));
}

export function startAndEndofWeek() {
  const today = new Date();
  const startOfTheWeek = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
  const endOfTheWeek = endOfWeek(today, { weekStartsOn: 1 });
  return { startOfTheWeek, endOfTheWeek };
}

export function sortAppointmentAccordingToDate(appointments: Appointment[]) {
  const slotsByDay: slotsByDay = {};
  appointments.forEach((appointment) => {
    const dateKey = format(appointment.dateTime, "yyyy-MM-dd"); // Format date to yyyy-MM-dd
    if (!slotsByDay[dateKey]) {
      slotsByDay[dateKey] = [];
    }
    slotsByDay[dateKey].push(format(appointment.dateTime, "HH:mm")); // Store time as HH:mm
  });
}

export async function fetchAppointmentById(
  id: number
): Promise<Appointment | null> {
  return await prisma.appointment.findUnique({
    where: {
      id: id,
    },
  });
}

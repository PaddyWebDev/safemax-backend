import { Router, Request, Response } from "express";
import {
  checkIfTheAppointmentExist,
  checkIfTheSlotISBooked,
  findAppointmentById,
  sortAppointmentAccordingToDate,
  startAndEndofWeek,
} from "../functions/validate-appointment";
import prisma from "../prisma";
import { io } from "../server"; // Import the io instance
import { formatDateTime, sendEmail } from "../functions/email";

const router: Router = Router();

router.get("/week", async function (req: Request, res: Response) {
  const { startOfTheWeek, endOfTheWeek } = startAndEndofWeek();

  try {
    // Fetch all appointments for the current week
    const appointments = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: startOfTheWeek,
          lte: endOfTheWeek,
        },
      },
      orderBy: {
        dateTime: "asc",
      },
    });

    // Organize appointments by date
    const slotsByDay = sortAppointmentAccordingToDate(appointments);

    res.json({ slotsByDay });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/book", async function (req: Request, res: Response) {
  try {
    const { name, email, time, comments } = req.body;

    // Check if an appointment already exists at the given time
    if (await checkIfTheSlotISBooked(time)) {
      // Send a response and exit the function early
      res.status(400).json({ message: "Meeting already booked at this time" });
    } else if (await checkIfTheAppointmentExist(email, time)) {
      res.status(409).json({
        message: "Your appointment already exist",
      });
    } else {
      // Create the appointment in the database
      const newAppointment = await prisma.appointment.create({
        data: {
          name,
          email,
          dateTime: time,
          status: "Pending",
          comments: comments || "No Comments",
        },
      });

      // Emit the new appointment via Socket.IO
      io.emit("new-appointment", newAppointment); // Emit to all clients

      // Return success response
      res.status(200).json({
        message: "Appointment created successfully",
      });
    }
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch(
  "/update-status/:id",
  async function (req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const existingAppointment = await findAppointmentById(Number(id));

      if (!existingAppointment) {
        res.status(404).json({
          message: "Appointment Doesn't Exist",
        });
      } else if (existingAppointment.status === status) {
        res.status(409).json({
          message: "This appointment is already " + status,
        });
      } else {
        await prisma.appointment.update({
          data: {
            status: status,
          },
          where: {
            id: Number(id),
          },
        });
        io.emit("appointment-status", { appointmentId: id, status: status });

        const { name, email, dateTime } = existingAppointment;

        const { date, time } = formatDateTime(String(dateTime));
        let message: string;
        if (status === "Approved") {
          message = `
            <p>Dear ${name},</p>
            <p>We are pleased to inform you that your appointment on <strong>${date}</strong> at <strong>${time}</strong> has been <strong>approved</strong>.</p>
            <p>If you have any questions or need to reschedule, please don't hesitate to reach out to us.</p>
            <p>We look forward to seeing you!</p>
            <p>Best regards,<br>Safemax Team</p>
          `;
        } else {
          message = `
            <p>Dear ${name},</p>
            <p>We regret to inform you that your appointment on <strong>${date}</strong> at <strong>${time}</strong> has been <strong>denied</strong>.</p>
            <p>Unfortunately, due to scheduling conflicts or other reasons, we are unable to accommodate your requested appointment. We truly appreciate your understanding.</p>
            <p>If you'd like to reschedule or discuss alternative options, please feel free to contact us, and we'd be happy to assist you.</p>
            <p>Thank you for your time and understanding.</p>
            <p>Best regards,<br>Safemax Team</p>
          `;
        }
        sendEmail(email!, message);

        res.status(200).json({
          message: "Appointment Approved",
        });
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;

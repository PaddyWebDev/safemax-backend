import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL!,
    pass: process.env.PASSWORD!,
  },
});

export async function sendEmail(email: string, message: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Status of Appointment",
      html: `<p>${message}</p>`, // Using the provided message for the email body
      replyTo: process.env.EMAIL,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent");
  } catch (error: any) {
    throw new Error("Error occured while processing the email" + error);
  }
}

export function formatDateTime(dateTime: string): { date: string, time: string } {
  const appointmentDateObj = new Date(dateTime);

  // Extract date (e.g., "November 15, 2024")
  const date = appointmentDateObj.toLocaleDateString(); 

  // Extract time (e.g., "10:00 AM")
  const time = appointmentDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return { date, time };
}
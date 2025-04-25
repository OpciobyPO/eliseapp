import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";

// PDF generation helper
async function generatePDF({ prenom, nom, secu }: { prenom: string; nom: string; secu: string }) {
  const html = `
    <html>
      <body>
        <h1>Note d'honoraire</h1>
        <p>Patient : ${prenom} ${nom}</p>
        <p>Numéro de sécurité sociale : ${secu}</p>
        <p>Date : ${new Date().toLocaleDateString()}</p>
        <p>Montant : 60€</p>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: "A4" });
  await browser.close();

  return pdf;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).end("Méthode non autorisée");
  }

  const { prenom, nom, secu, email } = req.body;

  if (!prenom || !nom || !secu || !email) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  try {
    const pdf = await generatePDF({ prenom, nom, secu });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Cabinet Ostéo" <${process.env.EMAIL_FROM}>`,
      to: email,
      cc: "elise.cevenes.osteopathe@gmail.com",
      subject: `Note d'honoraire - ${prenom} ${nom}`,
      text: "Veuillez trouver ci-joint votre note d'honoraire.",
      attachments: [
        {
          filename: `Note_${prenom}_${nom}.pdf`,
          content: pdf,
        },
      ],
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur envoi email : ", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { prenom, nom, secu, email } = req.body;

  if (!prenom || !nom || !secu || !email) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
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

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: `"Cabinet Ostéo" <${process.env.EMAIL_FROM}>`,
      to: email,
      cc: 'elise.cevenes.osteopathe@gmail.com',
      subject: `Note d'honoraire - ${prenom} ${nom}`,
      text: 'Veuillez trouver ci-joint votre note d’honoraire.',
      attachments: [
        {
          filename: `Note_${prenom}_${nom}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    return res.status(200).json({ message: 'Note envoyée' });

  } catch (error: any) {
    console.error('Erreur complète:', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { prenom, nom, secu, email } = req.body;

  if (!prenom || !nom || !secu || !email) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const messageHTML = `
      <h2>Note d'honoraires</h2>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Patient :</strong> ${prenom} ${nom}</p>
      <p><strong>Numéro de Sécurité Sociale :</strong> ${secu}</p>
      <p><strong>Acte :</strong> Consultation d'ostéopathie</p>
      <p><strong>Montant :</strong> 60€</p>
      <hr />
      <p>Élise Cévènes Colliou — Ostéopathe D.O.</p>
      <p>2 Place Cazalere, 31410 Le Fauga</p>
      <p>Tél : 06 71 33 53 58</p>
      <p>SIRET : 901 721 023 000 11 — ADELI : 310 016 084</p>
    `;

    await transporter.sendMail({
      from: `"Cabinet Ostéo" <${process.env.EMAIL_FROM}>`,
      to: email,
      cc: 'elise.cevenes.osteopathe@gmail.com',
      subject: `Votre note d'honoraire – ${prenom} ${nom}`,
      html: messageHTML
    });

    return res.status(200).json({ message: 'Mail envoyé sans PDF ✅' });

  } catch (error: any) {
    console.error('Erreur email :', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

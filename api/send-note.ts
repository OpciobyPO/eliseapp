import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import html_to_pdf from 'html-pdf-node'; // nouvelle ligne

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prenom, nom, secu, email, contrat, cabinet, adresse, telephone, prix, siret, adeli } = req.body;

  try {
    const messageHTML = `
      <h1>Cabinet d'Ostéopathie</h1>
      <h2>${cabinet}</h2>
      <p>${adresse}</p>
      <p>${telephone}</p>
      <hr>
      <h2>Note d'honoraires</h2>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Acte :</strong> Consultation d'ostéopathie</p>
      <p><strong>Honoraires :</strong> ${prix}€</p>
      <hr>
      <h2>Informations Patient</h2>
      <p><strong>Patient :</strong> ${prenom} ${nom}</p>
      <p><strong>Numéro de Sécurité Sociale :</strong> ${secu}</p>
      <p><strong>Numéro de contrat d'assurance :</strong> ${contrat}</p>
      <hr>
      <h2>Ostéopathe</h2>
      <p><strong>Nom :</strong> ${cabinet}</p>
      <p><strong>Numéro SIRET :</strong> ${siret}</p>
      <p><strong>Numéro ADELI :</strong> ${adeli}</p>
    `;

    // Convertir HTML en PDF Buffer
    const pdfBuffer = await html_to_pdf.generatePdf({ content: messageHTML }, { format: 'A4' });

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
      subject: `Votre note d'honoraire – ${prenom} ${nom}`,
      text: 'Veuillez trouver votre note d\'honoraire en pièce jointe.',
      attachments: [
        {
          filename: `Note_${prenom}_${nom}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    return res.status(200).json({ message: 'Mail envoyé avec PDF ✅' });

  } catch (error: any) {
    console.error('Erreur email :', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

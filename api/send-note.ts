import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

const { prenom, nom, secu, email, contrat, cabinet, adresse, telephone, prix, siret, adeli } = req.body;
  
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

    
    await transporter.sendMail({
      from: `${cabinet} <${process.env.EMAIL_FROM}>`,
      to: email,
     // cc: 'elise.cevenes.osteopathe@gmail.com',
      subject: `Votre note d'honoraire – ${prenom} ${nom}`,
      html: messageHTML
    });

    return res.status(200).json({ message: 'Mail envoyé sans PDF ✅' });

  } catch (error: any) {
    console.error('Erreur email :', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

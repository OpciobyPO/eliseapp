import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prenom, nom, secu, email, contrat, cabinet, adresse, telephone, prix, siret, adeli } = req.body;

  try {
    // 1. Créer un document PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;

    let y = height - 50;

    const lignes = [
      "Cabinet d'Ostéopathie",
      cabinet,
      adresse,
      telephone,
      "",
      "Note d'honoraires",
      `Date : ${new Date().toLocaleDateString()}`,
      "Acte : Consultation d'ostéopathie",
      `Honoraires : ${prix}€`,
      "",
      "Informations Patient",
      `Patient : ${prenom} ${nom}`,
      `N° Sécurité Sociale : ${secu}`,
      `N° contrat assurance : ${contrat}`,
      "",
      "Ostéopathe",
      `Nom : ${cabinet}`,
      `SIRET : ${siret}`,
      `ADELI : ${adeli}`
    ];

    lignes.forEach((text) => {
      page.drawText(text, {
        x: 50,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      y -= 20;
    });

    const pdfBytes = await pdfDoc.save();

    // 2. Envoi par mail
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
          content: pdfBytes
        }
      ]
    });

    return res.status(200).json({ message: 'Mail envoyé avec PDF ✅' });

  } catch (error: any) {
    console.error('Erreur email :', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

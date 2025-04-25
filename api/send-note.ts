import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  const { prenom, nom, secu, email, contrat, cabinet, adresse, telephone, prix, siret, adeli } = req.body;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // Format A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;

    // Fonction pour centrer du texte
    const centerText = (text, fontUsed, size, yPos) => {
      const textWidth = fontUsed.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: yPos,
        size: size,
        font: fontUsed,
        color: rgb(0, 0, 0)
      });
    };

    // Bloc Cabinet
    centerText(cabinet, fontBold, 16, y);
    y -= 20;
    centerText(adresse, font, 12, y);
    y -= 20;
    centerText(telephone, font, 12, y);

    y -= 40;

    // Titre "NOTE D'HONORAIRES"
    centerText("NOTE D'HONORAIRES", fontBold, 20, y);

    y -= 50;

    // Date
    page.drawText(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, {
      x: 50,
      y: y,
      size: 12,
      font: font,
      color: rgb(0, 0, 0)
    });

    y -= 40;

    // Bloc Acte / Honoraires (aligné mieux)
    page.drawText('Acte', { x: 50, y: y, size: 12, font: fontBold });
    page.drawText('Honoraires', { x: 300, y: y, size: 12, font: fontBold });
    y -= 20;
    page.drawText('Consultation d\'ostéopathie', { x: 50, y: y, size: 12, font: font });
    page.drawText(`${prix}€`, { x: 300, y: y, size: 12, font: font });

    y -= 50;

    // Bloc Patient
    page.drawText('Patient :', { x: 50, y: y, size: 12, font: fontBold });
    y -= 20;
    page.drawText(`${prenom} ${nom}`, { x: 50, y: y, size: 12, font: font });
    y -= 30;
    page.drawText('N° de sécurité sociale :', { x: 50, y: y, size: 12, font: fontBold });
    y -= 20;
    page.drawText(`${secu}`, { x: 50, y: y, size: 12, font: font });
    y -= 30;
    page.drawText('N° de contrat d\'assurance :', { x: 50, y: y, size: 12, font: fontBold });
    y -= 20;
    page.drawText(`${contrat || '-'}`, { x: 50, y: y, size: 12, font: font });

    y -= 50;



    // Bloc Ostéopathe tout en bas de la page
    const blocOsteoY = 100; // Position fixe à 100px du bas
    
    page.drawText('Ostéopathe :', { x: 50, y: blocOsteoY + 80, size: 12, font: fontBold });
    page.drawText(`${cabinet}`, { x: 50, y: blocOsteoY + 60, size: 12, font: font });
    page.drawText('Ostéopathe D.O.', { x: 50, y: blocOsteoY + 40, size: 12, font: font });
    page.drawText(`N° SIRET : ${siret}`, { x: 50, y: blocOsteoY + 20, size: 12, font: font });
    page.drawText(`N° ADELI : ${adeli}`, { x: 50, y: blocOsteoY, size: 12, font: font });
    page.drawText(`N° TEL : ${telephone}`, { x: 50, y: blocOsteoY - 20, size: 12, font: font });

    const pdfBytes = await pdfDoc.save();

    // Envoi du mail avec PDF
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

  } catch (error) {
    console.error('Erreur email :', error);
    return res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
}

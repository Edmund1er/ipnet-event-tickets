package tg.ipnetinstitute.technology.features.controle.wrapper;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;
import tg.ipnetinstitute.technology.features.controle.dto.request.FormatExport;
import tg.ipnetinstitute.technology.features.controle.dto.response.PersonneEntree;
import tg.ipnetinstitute.technology.features.controle.dto.response.StatistiquesEvenement;
import tg.ipnetinstitute.technology.features.evenement.dto.response.EvenementResume;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Locale;

/** Export PDF de la liste des présents (EF-45), aux couleurs IPNET. */
@Component
public class ExportPdfWrapper implements ExportateurStatistiques {

    private static final Color BLEU = new Color(0x1E, 0x5B, 0xA3);
    private static final Color ROUGE = new Color(0xB0, 0x32, 0x2A);
    private static final Color GRIS_CLAIR = new Color(0xF1, 0xF5, 0xF9);
    private static final DateTimeFormatter HEURE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter DATE_LONGUE =
            DateTimeFormatter.ofPattern("EEEE d MMMM yyyy 'à' HH'h'mm", Locale.FRENCH);

    @Override
    public FormatExport format() {
        return FormatExport.PDF;
    }

    @Override
    public byte[] exporter(EvenementResume evenement, StatistiquesEvenement stats) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 36, 36, 42, 36);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font marque = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BLEU);
        Font titre = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK);
        Font normal = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font entete = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
        Font cellule = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);

        Paragraph p = new Paragraph("IPNET Institute of Technology", marque);
        doc.add(p);
        Paragraph sous = new Paragraph("Liste des présents", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, ROUGE));
        sous.setSpacingAfter(10);
        doc.add(sous);
        doc.add(new Paragraph(evenement.titre(), titre));
        doc.add(new Paragraph(DATE_LONGUE.format(evenement.dateDebut())
                + (evenement.lieu() != null ? " — " + evenement.lieu() : ""), normal));
        Paragraph compteurs = new Paragraph("Entrées : " + stats.nombreEntrees()
                + "    Billets confirmés : " + stats.nombreBilletsConfirmes()
                + "    Restants : " + stats.nombreRestants(), normal);
        compteurs.setSpacingAfter(12);
        doc.add(compteurs);

        PdfPTable table = new PdfPTable(new float[]{1f, 3f, 3f, 5f, 3f});
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        for (String col : new String[]{"#", "Nom", "Prénom", "Profil", "Entrée"}) {
            PdfPCell c = new PdfPCell(new Phrase(col, entete));
            c.setBackgroundColor(BLEU);
            c.setPadding(5);
            table.addCell(c);
        }
        var personnes = stats.personnes().stream().sorted(Comparator.comparing(PersonneEntree::entreeLe)).toList();
        int n = 1;
        for (PersonneEntree pe : personnes) {
            Color fond = n % 2 == 0 ? GRIS_CLAIR : Color.WHITE;
            ajouter(table, String.valueOf(n++), cellule, fond);
            ajouter(table, pe.nom(), cellule, fond);
            ajouter(table, pe.prenom(), cellule, fond);
            ajouter(table, pe.detail(), cellule, fond);
            ajouter(table, pe.entreeLe() == null ? "" : HEURE.format(pe.entreeLe()), cellule, fond);
        }
        if (personnes.isEmpty()) {
            PdfPCell vide = new PdfPCell(new Phrase("Aucune entrée enregistrée", cellule));
            vide.setColspan(5);
            vide.setPadding(8);
            table.addCell(vide);
        }
        doc.add(table);

        Paragraph pied = new Paragraph("Document généré le " + HEURE.format(LocalDateTime.now()),
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
        pied.setSpacingBefore(12);
        doc.add(pied);
        doc.close();
        return out.toByteArray();
    }

    private static void ajouter(PdfPTable table, String texte, Font font, Color fond) {
        PdfPCell c = new PdfPCell(new Phrase(texte == null ? "" : texte, font));
        c.setBackgroundColor(fond);
        c.setPadding(4);
        table.addCell(c);
    }
}

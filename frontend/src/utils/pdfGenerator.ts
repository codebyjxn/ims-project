import { jsPDF } from 'jspdf';
import { UserTicket } from '../services/api/ticket';

export const downloadTicketPDF = (ticket: UserTicket) => {
  const doc = new jsPDF();

  // Helper to safely get details
  const concertName = ticket.concert_name ?? 'Concert Title Not Available';
  const arenaName = ticket.arena_name ?? 'Arena Not Available';
  const arenaLocation = ticket.arena_location ?? 'Location Not Available';
  const concertDate = ticket.concert_date ? new Date(ticket.concert_date).toLocaleDateString() : 'Date TBD';
  const concertTime = ticket.concert_time ?? 'Time TBD';

  // Set document properties
  doc.setProperties({
    title: `Ticket - ${concertName}`,
  });

  // Add a border
  doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10, 'S');

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCERT TICKET', doc.internal.pageSize.width / 2, 20, { align: 'center' });

  // Concert Details
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(concertName, doc.internal.pageSize.width / 2, 40, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${arenaName} - ${arenaLocation}`, doc.internal.pageSize.width / 2, 50, { align: 'center' });
  doc.text(`Date: ${concertDate} at ${concertTime}`, doc.internal.pageSize.width / 2, 60, { align: 'center' });

  // Divider
  doc.line(20, 70, doc.internal.pageSize.width - 20, 70);

  // Ticket Specifics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ticket Details', 20, 80);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ticket ID: ${ticket.ticket_id}`, 20, 90);
  doc.text(`Zone: ${ticket.zone_name}`, 20, 100);
  doc.text(`Purchase Price: $${Number(ticket.purchase_price || 0).toFixed(2)}`, 20, 110);
  doc.text(`Purchased On: ${new Date(ticket.purchase_date).toLocaleDateString()}`, 20, 120);

  // Footer
  doc.setFontSize(10);
  doc.text('This ticket is non-transferable. Please present this at the entrance.', doc.internal.pageSize.width / 2, 140, { align: 'center' });
  
  // Save the PDF with ticket ID as filename
  doc.save(`${ticket.ticket_id}.pdf`);
}; 
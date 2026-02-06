import nodemailer from 'nodemailer';
import pool from '../config/database.js';

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: `"Outfit Rental" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Send email error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendRentalConfirmation(rentalId, userId) {
    try {
      const [rental] = await pool.execute(
        `SELECT r.*, u.email, u.full_name 
         FROM rentals r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.id = ? AND r.user_id = ?`,
        [rentalId, userId]
      );

      if (rental.length === 0) return;

      const rentalData = rental[0];
      const [items] = await pool.execute(
        `SELECT ri.*, c.name as costume_name, c.brand
         FROM rental_items ri
         JOIN costumes c ON ri.costume_id = c.id
         WHERE ri.rental_id = ?`,
        [rentalId]
      );

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .rental-info { margin: 20px 0; }
            .rental-info table { width: 100%; border-collapse: collapse; }
            .rental-info th, .rental-info td { padding: 10px; border: 1px solid #ddd; }
            .rental-info th { background: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Xác nhận đơn thuê thành công</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${rentalData.full_name}</strong>,</p>
              <p>Đơn thuê của bạn đã được xác nhận thành công.</p>
              
              <div class="rental-info">
                <h3>Thông tin đơn thuê:</h3>
                <table>
                  <tr>
                    <th>Mã đơn:</th>
                    <td>${rentalData.id}</td>
                  </tr>
                  <tr>
                    <th>Ngày bắt đầu:</th>
                    <td>${new Date(rentalData.start_date).toLocaleDateString('vi-VN')}</td>
                  </tr>
                  <tr>
                    <th>Ngày hẹn trả:</th>
                    <td>${new Date(rentalData.due_date).toLocaleDateString('vi-VN')}</td>
                  </tr>
                  <tr>
                    <th>Tổng tiền:</th>
                    <td>${rentalData.total_amount_paid.toLocaleString('vi-VN')}đ</td>
                  </tr>
                </table>
              </div>

              <div class="rental-info">
                <h3>Trang phục đã thuê:</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Tên trang phục</th>
                      <th>Số lượng</th>
                      <th>Thương hiệu</th>
                      <th>Giá thuê/ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(item => `
                      <tr>
                        <td>${item.costume_name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.brand || 'N/A'}</td>
                        <td>${item.daily_price.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <p>Vui lòng đến địa chỉ của chúng tôi vào ngày bắt đầu thuê để nhận trang phục.</p>
              <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email này.</p>
            </div>
            <div class="footer">
              <p>Cảm ơn bạn đã sử dụng dịch vụ của Outfit Rental!</p>
              <p>Hotline: 0123 456 789 | Email: support@outfit-rental.com</p>
              <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail(
        rentalData.email,
        `Xác nhận đơn thuê #${rentalId}`,
        html
      );
    } catch (error) {
      console.error('Send rental confirmation error:', error);
    }
  }

  async sendReturnReminder(rentalId) {
    try {
      const [rentals] = await pool.execute(
        `SELECT r.*, u.email, u.full_name 
         FROM rentals r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.id = ? AND r.rental_status = 'renting' 
           AND r.due_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)`,
        [rentalId]
      );

      if (rentals.length === 0) return;

      const rental = rentals[0];

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff9800;">Nhắc nhở trả đồ</h2>
          <p>Xin chào <strong>${rental.full_name}</strong>,</p>
          <p>Đơn thuê #${rental.id} của bạn sẽ đến hạn vào ngày mai (${new Date(rental.due_date).toLocaleDateString('vi-VN')}).</p>
          <p>Vui lòng chuẩn bị trả trang phục đúng hẹn để tránh phí trễ hạn.</p>
          <p>Nếu bạn muốn gia hạn thêm, vui lòng liên hệ với chúng tôi.</p>
          <br>
          <p>Trân trọng,</p>
          <p><strong>Outfit Rental Team</strong></p>
        </div>
      `;

      return await this.sendEmail(
        rental.email,
        `Nhắc nhở trả đồ - Đơn #${rentalId}`,
        html
      );
    } catch (error) {
      console.error('Send return reminder error:', error);
    }
  }

  async sendOverdueNotification(rentalId) {
    try {
      const [rentals] = await pool.execute(
        `SELECT r.*, u.email, u.full_name 
         FROM rentals r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.id = ? AND r.rental_status = 'overdue'`,
        [rentalId]
      );

      if (rentals.length === 0) return;

      const rental = rentals[0];
      const overdueDays = Math.ceil((new Date() - new Date(rental.due_date)) / (1000 * 60 * 60 * 24));

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f44336;">Thông báo trả đồ trễ hạn</h2>
          <p>Xin chào <strong>${rental.full_name}</strong>,</p>
          <p>Đơn thuê #${rental.id} của bạn đã quá hạn ${overdueDays} ngày.</p>
          <p>Vui lòng trả trang phục ngay để tránh phí phạt tăng thêm.</p>
          <p>Phí trễ hạn hiện tại: ${rental.late_fee ? rental.late_fee.toLocaleString('vi-VN') + 'đ' : 'Đang tính...'}</p>
          <br>
          <p>Nếu bạn đã trả đồ, vui lòng bỏ qua email này.</p>
          <p>Trân trọng,</p>
          <p><strong>Outfit Rental Team</strong></p>
        </div>
      `;

      return await this.sendEmail(
        rental.email,
        `Thông báo trả đồ trễ hạn - Đơn #${rentalId}`,
        html
      );
    } catch (error) {
      console.error('Send overdue notification error:', error);
    }
  }

  async sendReturnProcessed(rentalId) {
    try {
      const [rentals] = await pool.execute(
        `SELECT r.*, u.email, u.full_name, 
                r.deposit_refund, r.additional_charge
         FROM rentals r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.id = ? AND r.rental_status = 'completed'`,
        [rentalId]
      );

      if (rentals.length === 0) return;

      const rental = rentals[0];

      let refundInfo = '';
      if (rental.deposit_refund > 0) {
        refundInfo = `<p>Số tiền hoàn cọc: <strong>${rental.deposit_refund.toLocaleString('vi-VN')}đ</strong></p>`;
      }
      if (rental.additional_charge > 0) {
        refundInfo += `<p>Phí phát sinh cần thanh toán thêm: <strong>${rental.additional_charge.toLocaleString('vi-VN')}đ</strong></p>`;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Đã xử lý trả đồ</h2>
          <p>Xin chào <strong>${rental.full_name}</strong>,</p>
          <p>Đơn thuê #${rental.id} của bạn đã được xử lý trả đồ thành công.</p>
          <p>Ngày trả: ${rental.return_date ? new Date(rental.return_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
          ${refundInfo}
          <br>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          <p>Trân trọng,</p>
          <p><strong>Outfit Rental Team</strong></p>
        </div>
      `;

      return await this.sendEmail(
        rental.email,
        `Đã xử lý trả đồ - Đơn #${rentalId}`,
        html
      );
    } catch (error) {
      console.error('Send return processed error:', error);
    }
  }

  async sendDailyReport(toEmails) {
    try {
      const [todayStats] = await pool.execute(`
        SELECT 
          COUNT(*) as today_rentals,
          SUM(total_amount_paid) as today_revenue,
          COUNT(CASE WHEN rental_status = 'pending' THEN 1 END) as pending_rentals,
          COUNT(CASE WHEN rental_status = 'overdue' THEN 1 END) as overdue_rentals
        FROM rentals 
        WHERE DATE(created_at) = CURDATE()
      `);

      const [costumeStats] = await pool.execute(`
        SELECT 
          COUNT(*) as low_stock,
          GROUP_CONCAT(name) as low_stock_items
        FROM costumes 
        WHERE available_quantity <= 3 AND status = 'available'
      `);

      const stats = todayStats[0];
      const costumeInfo = costumeStats[0];

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">Báo cáo hoạt động ngày ${new Date().toLocaleDateString('vi-VN')}</h2>
          
          <h3>📊 Thống kê hôm nay:</h3>
          <ul>
            <li>Số đơn thuê mới: <strong>${stats.today_rentals || 0}</strong></li>
            <li>Doanh thu hôm nay: <strong>${stats.today_revenue ? stats.today_revenue.toLocaleString('vi-VN') + 'đ' : '0đ'}</strong></li>
            <li>Đơn chờ xử lý: <strong>${stats.pending_rentals || 0}</strong></li>
            <li>Đơn quá hạn: <strong>${stats.overdue_rentals || 0}</strong></li>
          </ul>

          ${costumeInfo.low_stock > 0 ? `
          <h3 style="color: #ff9800;">⚠ Cảnh báo tồn kho thấp:</h3>
          <p>Có <strong>${costumeInfo.low_stock}</strong> trang phục sắp hết hàng:</p>
          <p>${costumeInfo.low_stock_items}</p>
          ` : ''}

          <br>
          <p><em>Báo cáo tự động - Outfit Rental System</em></p>
        </div>
      `;

      const results = [];
      for (const email of toEmails) {
        const result = await this.sendEmail(
          email,
          `Báo cáo hoạt động - ${new Date().toLocaleDateString('vi-VN')}`,
          html
        );
        results.push({ email, result });
      }

      return results;
    } catch (error) {
      console.error('Send daily report error:', error);
    }
  }
}

export default new NotificationService();
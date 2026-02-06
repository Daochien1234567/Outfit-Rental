import Penalty from '../models/Penalty.js';
import pool from '../config/database.js';

class PenaltyService {
  async calculateRentalPenalties(rentalId) {
    try {
      const [rentalItems] = await pool.execute(
        `SELECT ri.*, c.original_value, c.daily_price
         FROM rental_items ri
         JOIN costumes c ON ri.costume_id = c.id
         WHERE ri.rental_id = ?`,
        [rentalId]
      );

      const [rental] = await pool.execute(
        `SELECT * FROM rentals WHERE id = ?`,
        [rentalId]
      );

      if (rentalItems.length === 0 || rental.length === 0) {
        throw new Error('Không tìm thấy thông tin đơn thuê');
      }

      const rentalData = rental[0];
      const today = new Date();
      const dueDate = new Date(rentalData.due_date);
      const returnDate = rentalData.return_date ? new Date(rentalData.return_date) : today;

      let totalLateFee = 0;
      let totalDamageFee = 0;
      let totalLostFee = 0;

      // Tính phí trễ hạn cho toàn bộ đơn
      if (returnDate > dueDate) {
        const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        
        for (const item of rentalItems) {
          const lateFee = await Penalty.calculateLateFee(
            item.rental_days || rentalData.rental_days,
            item.daily_price,
            overdueDays
          );
          totalLateFee += lateFee;
        }
      }

      // Cập nhật phí trễ vào database
      if (totalLateFee > 0) {
        await pool.execute(
          'UPDATE rentals SET late_fee = ? WHERE id = ?',
          [totalLateFee, rentalId]
        );
      }

      return {
        total_late_fee: totalLateFee,
        total_damage_fee: totalDamageFee,
        total_lost_fee: totalLostFee,
        total_penalty: totalLateFee + totalDamageFee + totalLostFee
      };
    } catch (error) {
      console.error('Calculate penalties error:', error);
      throw error;
    }
  }

  async calculateItemReturnPenalty(itemId, returnCondition, damageDescription) {
    try {
      const [item] = await pool.execute(
        `SELECT ri.*, c.original_value, c.daily_price
         FROM rental_items ri
         JOIN costumes c ON ri.costume_id = c.id
         WHERE ri.id = ?`,
        [itemId]
      );

      if (item.length === 0) {
        throw new Error('Không tìm thấy thông tin item');
      }

      const itemData = item[0];
      let penaltyFee = 0;

      switch (returnCondition) {
        case 'minor_damage':
        case 'major_damage':
          const damageType = returnCondition.split('_')[0];
          penaltyFee = await Penalty.calculateDamageFee(
            damageType,
            itemData.original_value
          );
          break;

        case 'lost':
          penaltyFee = await Penalty.calculateLostFee(itemData.original_value);
          break;

        case 'good':
          penaltyFee = 0;
          break;

        default:
          throw new Error('Tình trạng trả không hợp lệ');
      }

      // Cập nhật vào database
      await pool.execute(
        `UPDATE rental_items 
         SET return_condition = ?, 
             damage_description = ?,
             damage_fee = ?
         WHERE id = ?`,
        [returnCondition, damageDescription, penaltyFee, itemId]
      );

      return penaltyFee;
    } catch (error) {
      console.error('Calculate item penalty error:', error);
      throw error;
    }
  }

  async applyAutomaticPenalties() {
    try {
      // Tìm các đơn thuê quá hạn chưa được xử lý
      const [overdueRentals] = await pool.execute(
        `SELECT id, due_date, total_deposit
         FROM rentals 
         WHERE rental_status IN ('renting', 'out_for_delivery')
           AND due_date < CURDATE()
           AND (late_fee IS NULL OR late_fee = 0)`
      );

      for (const rental of overdueRentals) {
        await this.calculateRentalPenalties(rental.id);
        
        // Cập nhật trạng thái thành overdue
        await pool.execute(
          'UPDATE rentals SET rental_status = "overdue" WHERE id = ?',
          [rental.id]
        );
      }

      return {
        processed: overdueRentals.length,
        message: `Đã xử lý ${overdueRentals.length} đơn thuê quá hạn`
      };
    } catch (error) {
      console.error('Apply automatic penalties error:', error);
      throw error;
    }
  }

  async getPenaltySummary(rentalId) {
    try {
      const [penalties] = await pool.execute(
        `SELECT 
           SUM(late_fee) as total_late_fee,
           SUM(damage_fee) as total_damage_fee,
           COUNT(CASE WHEN return_condition = 'lost' THEN 1 END) as lost_items,
           COUNT(CASE WHEN return_condition IN ('minor_damage', 'major_damage') THEN 1 END) as damaged_items
         FROM rental_items 
         WHERE rental_id = ?`,
        [rentalId]
      );

      const [rental] = await pool.execute(
        `SELECT total_deposit, total_fine, deposit_refund 
         FROM rentals WHERE id = ?`,
        [rentalId]
      );

      if (rental.length === 0) {
        throw new Error('Không tìm thấy đơn thuê');
      }

      const summary = penalties[0];
      const rentalData = rental[0];

      // Tính toán hoàn cọc
      const totalPenalty = (summary.total_late_fee || 0) + (summary.total_damage_fee || 0);
      const maxRefund = rentalData.total_deposit - totalPenalty;
      const depositRefund = Math.max(0, maxRefund);
      const additionalCharge = Math.max(0, totalPenalty - rentalData.total_deposit);

      return {
        penalties: summary,
        deposit: {
          total: rentalData.total_deposit,
          refundable: depositRefund,
          additional_charge: additionalCharge
        },
        total_penalty: totalPenalty
      };
    } catch (error) {
      console.error('Get penalty summary error:', error);
      throw error;
    }
  }
}

export default new PenaltyService();
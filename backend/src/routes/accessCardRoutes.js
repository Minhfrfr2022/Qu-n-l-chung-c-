const express = require('express');
const router = express.Router();
const accessCardController = require('../controllers/accessCardController');
const { verifyToken } = require('../middleware/auth');

// Tất cả routes đều yêu cầu xác thực
router.use(verifyToken);

// ==================== ROUTES GET ====================
// Lấy tất cả thẻ (admin/manager xem tất cả, cư dân xem thẻ của mình)
router.get('/', accessCardController.getAllCards);

// Lấy thông tin thẻ theo ID
router.get('/:id', accessCardController.getCardById);

// Lấy thẻ theo cư dân (chỉ admin/manager)
router.get('/resident/:residentId', accessCardController.getResidentCards);

// Lấy thẻ theo trạng thái (chỉ admin/manager)
router.get('/status/:status', accessCardController.getCardsByStatus);

// Lấy lịch sử quét thẻ
router.get('/:id/access-logs', accessCardController.getCardAccessLogs);

// Lấy lịch sử thay đổi thẻ
router.get('/:id/history', accessCardController.getCardHistory);

// Lấy các khoản phí liên quan đến thẻ
router.get('/:id/fees', accessCardController.getCardFees);

// Lấy thống kê thẻ (chỉ admin/manager)
router.get('/statistics/overview', accessCardController.getCardStatistics);

// ==================== ROUTES POST ====================
// Tạo thẻ mới (chỉ admin/manager)
router.post('/', accessCardController.createCard);

// Ghi log quét thẻ (cho hệ thống thiết bị)
router.post('/access-log', accessCardController.logCardAccess);

// ==================== ROUTES PUT ====================
// Cập nhật trạng thái thẻ (chỉ admin/manager)
router.put('/:id/status', accessCardController.updateCardStatus);

// Báo mất thẻ (cư dân hoặc admin/manager)
router.put('/:id/report-lost', accessCardController.reportCardLost);

// Báo hỏng thẻ (cư dân hoặc admin/manager)
router.put('/:id/report-damaged', accessCardController.reportCardDamaged);

// Gia hạn thẻ (chỉ admin/manager)
router.put('/:id/renew', accessCardController.renewCard);

// ==================== ROUTES DELETE ====================
// Xóa thẻ (chỉ admin)
router.delete('/:id', accessCardController.deleteCard);

module.exports = router;

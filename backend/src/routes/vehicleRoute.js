const express = require("express")
const {VehicleController} = require("../controllers/vehicleController")
const {requireAdminOrManager} = require("../middleware/auth");

const router = express.Router();
const controller = new VehicleController();


// TODO: add a middleware to check access for insert and update
router.post("/insert", controller.insert_new_vehicle.bind(controller));
router.patch("/update", controller.update_a_vehicle.bind(controller));
router.post("/delete", controller.delete_a_vehicle.bind(controller))
router.get("/query-by-owner", controller.query_vehicles_by_owner.bind(controller));
router.get("/query-by-owner-type", controller.query_vehicles_by_type_and_owner.bind(controller));
router.get("/query-by-apt", controller.query_vehicles_by_apt.bind(controller));
router.get("/query-by-apt-type", controller.query_vehicles_by_type_and_apt.bind(controller));
router.get("/query-all", controller.query_all_vehicles.bind(controller));
router.get("/query-all-with-type", controller.query_all_vehicles_with_type.bind(controller));
router.get("/count-by-apt-type", controller.count_vehicles_by_type_and_apt.bind(controller));
router.get("/count-all-by-type", controller.count_all_vehicles_by_type.bind(controller));
router.get("/query-with-filter", controller.query_with_filter.bind(controller));


// 
router.post("/insert-request", controller.new_request.bind(controller));
router.patch("/update-request", controller.update_request.bind(controller));
router.post("/delete-request", controller.delete_request.bind(controller));
router.get("/query-all-request", controller.query_all_request.bind(controller));
router.get("/query-request-by-apt", controller.query_request_by_apt.bind(controller));

// Approve and reject vehicle registration requests (admin only)
router.post("/approve-request", requireAdminOrManager, controller.approve_request.bind(controller));
router.post("/reject-request", requireAdminOrManager, controller.reject_request.bind(controller));


module.exports = router;
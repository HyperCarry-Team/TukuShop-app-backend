const express = require("express");
// const validation = require("../validations/user.validation");
// const runValidation = require("../middleware/runValidation");
const { editProfileBuyer, editProfileSeller, getListBuyer } = require("../controllers/user.controller");
const jwtAuth = require("../middleware/jwtAuth");
const upload = require("../middleware/upload");
const {onlyAdmin, myself} = require("../middleware/authorization");

const router = express.Router();

router
	.get("/user/buyer", jwtAuth, onlyAdmin, getListBuyer)
	.put("/user/:id/buyer", jwtAuth, myself, upload, editProfileBuyer)
	.put("/user/:id/seller", jwtAuth, myself, upload, editProfileSeller);

module.exports = router;
const userModel = require("../models/user.model");
const { success, failed } = require("../helpers/response");
const deleteFile = require("../helpers/deleteFile");
const uploadGoogleDrive = require("../helpers/uploadGoogleDrive");
const deleteGoogleDrive = require("../helpers/deleteGoogleDrive");
const createPagination = require("../helpers/createPagination");

module.exports = {
	getListBuyer: async (req, res) => {
		try {
			const { page, limit, search = "", sort = "" } = req.query;
			const count = await userModel.countBuyer(search);
			console.log(count.rows);
			const countNumber = count.rows.length ? count.rows[0].count : 0;
			const paging = createPagination(countNumber, page, limit);
			const users = await userModel.selectAllBuyer(paging, search, sort);

			success(res, {
				code: 200,
				status: "success",
				data: users.rows,
				message: "Select List Buyer Success",
				pagination: paging.response,
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
	getListSeller: async (req, res) => {
		try {
			const { page, limit, search = "", sort = "" } = req.query;
			const count = await userModel.countSeller(search);
			const countNumber = count.rows.length ? count.rows[0].count : 0;
			const paging = createPagination(countNumber, page, limit);
			const users = await userModel.selectAllSeller(paging, search, sort);

			success(res, {
				code: 200,
				status: "success",
				data: users.rows,
				message: "Select List Seller Success",
				pagination: paging.response,
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
	getDetailUser: async (req, res) => {
		try {
			const { id } = req.params;
			let user = await userModel.findBy("id", id);

			// jika user tidak ditemukan
			if (!user.rowCount) {
				failed(res, {
					code: 404,
					status: "error",
					message: "Select Detail User Failed",
					error: `User with Id ${id} not found`,
				});
				return;
			}

			// jika user adalah seller
			if (user.rows[0].level === 2) {
				console.log("B");
				user = await userModel.getDetailSeller(id);
			}

			// jika user adalah buyer
			else {
				console.log("C");
				user = await userModel.getDetailBuyer(id);
			}

			success(res, {
				code: 200,
				status: "success",
				data: user.rows[0],
				message: "Select Detail User Success",
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
	editProfileBuyer: async (req, res) => {
		try {
			const { id } = req.params;
			const { name, phone, gender, birth } = req.body;

			const user = await userModel.findBy("id", id);
			// jika user tidak ditemukan
			if (!user.rowCount) {
				if (req.file) {
					deleteFile(req.file.path);
				}

				failed(res, {
					code: 404,
					status: "failed",
					error: `User with Id ${id} not found`,
					message: "Update User Failed",
				});
				return;
			}

			let { photo } = user.rows[0];
			if (req.file) {
				if (user.rows[0].photo) {
					// menghapus photo lama dari gd
					await deleteGoogleDrive(user.rows[0].photo);
				}
				// upload photo baru ke gd
				const photoGd = await uploadGoogleDrive(req.file);
				photo = photoGd.id;
				// menghapus photo setelah diupload ke gd
				deleteFile(req.file.path);
			}

			await userModel.updateUser(id, {
				name,
				photo,
			});
			await userModel.updateProfileBuyer(id, {
				phone,
				gender,
				birth,
			});

			success(res, {
				code: 200,
				status: "success",
				message: "Edit Profile Success",
				data: null,
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
	editProfileSeller: async (req, res) => {
		try {
			const { id } = req.params;
			const { name, storeName, storePhone, storeDescription } = req.body;

			const user = await userModel.findBy("id", id);
			// jika user tidak ditemukan
			if (!user.rowCount) {
				if (req.file) {
					deleteFile(req.file.path);
				}

				failed(res, {
					code: 404,
					status: "failed",
					error: `User with Id ${id} not found`,
					message: "Update User Failed",
				});
				return;
			}

			let { photo } = user.rows[0];
			if (req.file) {
				if (user.rows[0].photo) {
					// menghapus photo lama dari gd
					await deleteGoogleDrive(user.rows[0].photo);
				}
				// upload photo baru ke gd
				const photoGd = await uploadGoogleDrive(req.file);
				photo = photoGd.id;
				// menghapus photo setelah diupload ke gd
				deleteFile(req.file.path);
			}

			await userModel.updateUser(id, {
				name,
				photo,
			});
			await userModel.updateProfileSeller(id, {
				storeName,
				storePhone,
				storeDescription,
			});

			success(res, {
				code: 200,
				status: "success",
				message: "Edit Profile Success",
				data: null,
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
	getListChatSeller: async (req, res) => {
		try {
			const buyers = await userModel.listChatSelector(3);

			for (let i = 0; i < buyers.rows.length; i++) {
				const checkAlreadyChat = await userModel.listChat(
					req.APP_DATA.tokenDecoded.id,
					buyers.rows[i].id
				);

				if (checkAlreadyChat.rowCount) {
					buyers.rows[i].already_chat = true;
				} else {
					buyers.rows[i].already_chat = false;
				}
			}

			const buyersFilter = buyers.rows.filter((item) => {
				return item.already_chat;
			});

			success(res, {
				code: 200,
				status: "success",
				message: "Select List Chat Seller Success",
				data: buyersFilter,
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
	getListChatBuyer: async (req, res) => {
		try {
			const sellers = await userModel.listChatSelector(2);

			for (let i = 0; i < sellers.rows.length; i++) {
				const checkAlreadyChat = await userModel.listChat(
					req.APP_DATA.tokenDecoded.id,
					sellers.rows[i].id
				);

				if (checkAlreadyChat.rowCount) {
					sellers.rows[i].already_chat = true;
				} else {
					sellers.rows[i].already_chat = false;
				}
			}

			const sellersFilter = sellers.rows.filter((item) => {
				return item.already_chat;
			});

			success(res, {
				code: 200,
				status: "success",
				message: "Select List Chat Buyer Success",
				data: sellersFilter,
			});
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message,
			});
		}
	},
};

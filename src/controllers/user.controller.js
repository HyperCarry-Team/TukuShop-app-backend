const userModel = require("../models/user.model");
const { success, failed } = require("../helpers/response");
const deleteFile = require("../helpers/deleteFile");
const uploadGoogleDrive = require("../helpers/uploadGoogleDrive");
const deleteGoogleDrive = require("../helpers/deleteGoogleDrive");
const createPagination = require("../helpers/createPagination");
const axios = require("axios")
const crypto = require('crypto');
const oauth1a = require('oauth-1.0a');

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
	getTwitterTweets: (req, res) => {
		try {
			const { search } = req.query
			const OauthHelper = (request) => {
				const OAuthOptions = {
					algorithm: 'HMAC-SHA1',
					key: 'wo1C8RELro6wF8htB3IqIZANF',
					secret: 'AZTcfIf4ct30Ycz6LaYqNxn5ZU0TcmEXnpeyWUw3UbYtiivQ3U',
					token: '4474795753-IbCtklih8n2RhNulueEJUYR5oCg1rmpnHsTtg89',
					tokenSecret: 'jHVIqW7hMQa1qjAU0kRZBpJ4OGqwmEau5vhxQmqVdAoUP',
				};
				const oauth = oauth1a({
					consumer: { key: OAuthOptions.key, secret: OAuthOptions.secret },
					signature_method: 'HMAC-SHA1',
					hash_function(base_string, key) {
							return crypto
									.createHmac('sha1', key)
									.update(base_string)
									.digest('base64')
					},
				})
				const authorization = oauth.authorize(request, {
					key: OAuthOptions.token,
					secret: OAuthOptions.tokenSecret,
				});
				return oauth.toHeader(authorization);
			}
			const request = {
				url: `https://api.twitter.com/1.1/search/tweets.json?q=${encodeURIComponent(search)}&result_type=latest&count=15&include_rts=false&exclude_replies=true`,
				method: 'GET'
			};
			console.log(request)
			const authHeader = OauthHelper(request)
			axios
      .get(
        request.url,
				{
					headers: authHeader
				}
      )
      .then((result) => {
        success(res, {
					code: 200,
					status: "success",
					message: "berhasil mendapatkan response",
					data: result.data
				})
      })
      .catch((error) => {
        failed(res, {
					code: 500,
					status: "error",
					message: "gagal mendapatkan response",
					error: error.message
				})
      });
		} catch (error) {
			failed(res, {
				code: 500,
				status: "error",
				message: "Internal Server Error",
				error: error.message
			})
		}
	},
	getInstagramSearch: (req, res) => {
		try {
			const { search } = req.query
			// const url = `http://103.152.118.117/api/instagram`
			const url = `https://www.instagram.com/web/search/topsearch/?context=blended&query=${encodeURIComponent(search)}&rank_token=0.3976291139390087&include_reel=true`
			// const payload = {
			// 	search: encodeURIComponent(search)
			// }
			const headers = {
				headers: {
					accept: `*/*`,
					"accept-language": `en-US,en;q=0.9`,
					cookie: "ig_did=61E48D8E-111B-4A16-BCD0-EC567D0A5358; mid=YX-HXQALAAGKorCOC0puXkUsy_H8; fbm_124024574287414=base_domain=.instagram.com; datr=lGnCYbIYUGYDkayAQzyzh33z; csrftoken=RNVNkHR4DN7Ogxw6Zj8OTAvfYQKNYU53; ds_user_id=6157404468; shbid=\"14805\0546157404468\0541699286046:01f7b26418dede9b6eaed4325db4aaafb6a7b03cb74c84172e2899db2828d7eb9f20a443\"; shbts=\"1667750046\0546157404468\0541699286046:01f7ebafbdc8d98f709b1deb8c0af8403dfc2cccc5fb1aeb9f84273d4055c99a7f748f43\"; sessionid=6157404468%3AUCPutOKVJF85de%3A20%3AAYdMIBubRx5duhGSKmEgu70FglTjEpm5SI1kBJ9Y2dY; fbsr_124024574287414=GqFueLycHDYHqqI6QsW0EhoUIlFxyARDYWTws7gs79M.eyJ1c2VyX2lkIjoiMTAwMDAxNjE5MTcyMDgxIiwiY29kZSI6IkFRRFZjSWFoNHRFNnN4Q1FObHI1SFBuSjJHdzlFMFE4RVhfWnhzVGFLa0VtRmFGWFZJN2xwMHRIWlN3bHdfVTZqV09kR29qYmgteDBncU9QUFJKZnUzOUxZNXVVNWlTa0pLN3ZQcHptcFRmT1RGcE5aU0JaZXRrRldoeEU3NEZ4VU9ZMlNaME5UbHlSSXk4VTF1RHdqRWlwdk9FaDZYQzBPZ3Q5U2tfVXdrdkZsTDY4aVNaTUdFQVhfVmJSMFdjWTZ0b1pib3R3M0kwX0ZJcXFkVGtPV1lDbUVfbGVpMjdvb1FrNzQ0NDlOMTVnWkt3WC1HampMeElHY2FEV1Nxbms1NVdDZkdYX21ndGM5SU1LOUkwUmdVN1ZLLTdmeWpoTi1hTTBRUnF5Y3hJeHVKbU5xQzZmRFQ4LVZ5bWtlS295bE1wcmd6VWNEZjNrYjY1SmdtT3Ftc3dwIiwib2F1dGhfdG9rZW4iOiJFQUFCd3pMaXhuallCQURsRjhWTENFUEhRVEVDWEd4MXBlSGU0OERLaWxaQkE5a2xJdnpHaFk0Z0NYMkNhWkFOYWRGTk1PV0diU1hLcjhPa1pCcW5jaXpkTkwwcmoxQ1dvV0RqVzdxZ3Z1T1NEaTBTWkJoYUh3TjBVN0N2aTZKME5pWkJFTWN1bVhZU1pCdVZkbm5jUW5sajRFNFY3ODh4eXRYNHZYaU1FU20weXlTRExzZHRkNlhXWkFnQ2NqeUEzWkNJWkQiLCJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTY2NzkwODQ4MH0; rur=\"CCO\0546157404468\0541699444505:01f7e92aa7dc0a9f21c942741c84a0314607e9d0003783f109fa75532193546600f1b8d3",
					origin: `https://www.instagram.com`,
					referer: `https://www.instagram.com/`,
					"sec-ch-ua": `"Chromium";v="106", "Google Chrome";v="106", "Not;A=Brand";v="99"`,
					"sec-ch-ua-mobile": `?0`,
					"sec-ch-ua-platform": "Windows",
					"sec-fetch-dest": "empty",
					"sec-fetch-mode": "cors",
					"sec-fetch-site": "same-site",
					"user-agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36`,
					"x-asbd-id": 198387,
					"x-csrftoken": `RNVNkHR4DN7Ogxw6Zj8OTAvfYQKNYU53`,
					"x-ig-app-id": 936619743392459,
					"x-ig-www-claim": `hmac.AR0uJkSF2CV6vZHTxGLigA3BemqUa91fYfED3KW6xWkBxCJi`,
					"x-instagram-ajax": `3aeb04d1923b`,
					"x-requested-with": "XMLHttpRequest"
				}
			}
			// axios.post(url, payload)
			axios.get(url, headers)
      .then((result) => {
				console.log(result.data);
        success(res, {
					code: 200,
					status: "success",
					message: "berhasil mendapatkan response",
					data: result.data
				})
      })
      .catch((error) => {
				console.log(error.response.data)
        success(res, {
					code: 200,
					status: "error",
					message: "gagal mendapatkan response",
					error: error.message
				})
      });
		} catch (error) {
			success(res, {
				code: 200,
				status: "error",
				message: "Internal Server Error",
				error: error.message
			})
		}
	}
};

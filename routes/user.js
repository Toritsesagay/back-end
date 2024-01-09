const express = require("express")
const router = express.Router()
const { verifyEmail, sendRecoverEmail, checkrecovertokenvalidity, changepassword, hasCard, createCard, deleteCard, deposit, createDeposit, withdraw, createWithdraw, bsa,tax, sendAccount, transfersToAccount, sendOtp, checkOtp,beneficiaries, createBeneficiaries, deleteBeneficiaries, getNotifications, deleteNotification } = require("../controller/user")

let login = require("../controller/user").login
let signup = require("../controller/user").signup
let checkverification = require("../controller/user").checkverification
let getUserFromJwt = require("../controller/user").getUserFromJwt
let phonesignup = require("../controller/user").phonesignup
let verifyphone = require("../controller/user").verifyphone
let registeration = require("../controller/user").registeration
let profilephoto = require("../controller/user").profilephoto
let fetchAllAccount = require("../controller/user").fetchAllAccount


//auth route
router.get("/userbytoken", getUserFromJwt)
router.post("/login",login)
router.post('/signup', signup)
//route to check after signup
router.get('/checkverification/:email', verifyEmail)
//route to verify user from email inbox
router.get('/verifying/:token', checkverification)
//route to send user password recovery link
router.post('/recoverpassword',sendRecoverEmail)
router.get('/checkrecovertokenvalidity/:token',checkrecovertokenvalidity)
router.post('/changepassword/:token',changepassword)
router.post('/phonesignup/:token',phonesignup)
router.post('/verifyphone/:token',verifyphone)
router.post('/registeration/:token',registeration)
router.post('/pofilephoto/:token',profilephoto)
router.get('/hascard/:token',hasCard)
router.post('/createcard/:token',createCard)
router.delete('/deletecard/:token',deleteCard)
//router.get('/deposits/:token',deposit)
router.post('/deposits/:token',createDeposit)
router.post('/withdraw/:token',createWithdraw)
router.get('/withdraws/:token',transfersToAccount)
router.post('/tax/:token',tax)
router.post('/bsa/:token',bsa)
router.post('/sendaccount/:token',sendAccount)
router.get('/transferstoaccount/:token',transfersToAccount)
router.get('/accounts/:token',fetchAllAccount)

router.get('/otpcode/:token',sendOtp)
router.post('/otpcode/:token',checkOtp)
router.get('/beneficiaries/:token',beneficiaries)
router.post('/beneficiaries/:token',createBeneficiaries)
router.delete('/beneficiaries/:token',deleteBeneficiaries)
router.get('/notifications/:token',getNotifications)
router.delete('/notifications/:token/:id',deleteNotification)
router.delete('/accounts/:token',deleteNotification)










exports.router = router
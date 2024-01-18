const express = require("express")
const router = express.Router()
const { verifyAdmin} = require("../utils/utils")
const  {fetchHistory, updateHistory,fetchAccounts,createAccounts, deleteAccounts,updateAccounts, credit, debit, fetchLoan, updateLoan, fetchCard, updateCard } = require("../controller/admin")

let login = require("../controller/admin").login
let signup = require("../controller/admin").signup
let fetchUsers = require("../controller/admin").fetchUsers
let updateUser = require("../controller/admin").updateUser
let deleteUser = require("../controller/admin").deleteUser
let sendEmail = require("../controller/admin").sendEmail

//auth route
router.post("/adminlogin",login)
router.post('/adminsignup',signup)
//user routes
router.get('/users',verifyAdmin,fetchUsers)
router.patch('/users',verifyAdmin,updateUser)
router.delete('/users/:id',verifyAdmin,deleteUser)

//transfers routes
router.get('/history/:id',verifyAdmin,fetchHistory)
router.patch('/history/:id',verifyAdmin,updateHistory)
router.post('/sendemail',verifyAdmin,sendEmail)



//loans routes
router.get('/loan/:id',verifyAdmin,fetchLoan)
router.patch('/loan/:id',verifyAdmin,updateLoan)




//cards routes
router.get('/card/:id',verifyAdmin,fetchCard)
router.patch('/card/:id',verifyAdmin,updateCard)


//account routes
router.get('/admin-accounts/:id',verifyAdmin,fetchAccounts)
router.post('/admin-accounts/:id',verifyAdmin,createAccounts)
router.delete('/admin-accounts/:id',verifyAdmin,deleteAccounts)
router.patch('/admin-accounts',verifyAdmin,updateAccounts)

//credit and debit routes
router.post('/credit',verifyAdmin,credit)
router.post('/debit',verifyAdmin,debit)






exports.router = router
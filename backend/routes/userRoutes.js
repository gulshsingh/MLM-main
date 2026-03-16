const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
 signup,
 login,
 getLevelUsers,
 getTree
} = require("../controllers/userController");

router.post("/signup", signup);
router.post("/login", login);

// protected routes
router.get("/levels/:userId", auth, getLevelUsers);

router.get("/tree/:userId", auth, getTree);

module.exports = router;
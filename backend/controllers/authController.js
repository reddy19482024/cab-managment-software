const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const models = require("../models/dynamicModels");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const Employee = models.Employee;
  
  try {
    const user = await Employee.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken } = require('../utils/jwtUtils');
const { validationResult } = require('express-validator');

// Register user and company
exports.register = async (req, res, next) => {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role, companyName, companyEmail, companyAddress, companyPhone, industry } = req.body;

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    
    const existingCompany = await Company.findOne({ email: companyEmail });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this email already exists'
      });
    }

    // Create company
    const company = await Company.create({
      name: companyName,
      email: companyEmail,
      address: companyAddress,
      phone: companyPhone,
      industry
    });

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'admin',
      companyId: company._id
    });

    // Generate JWT token
    const token = generateToken({
      user_id: user._id,
      company_id: company._id,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'User and company registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        company: {
          id: company._id,
          name: company.name,
          email: company.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

  
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get company details
    const company = await Company.findById(user.companyId);
    if (!company || !company.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Company account is inactive'
      });
    }

    const token = generateToken({
      user_id: user._id,
      company_id: company._id,
      role: user.role
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        company: {
          id: company._id,
          name: company.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
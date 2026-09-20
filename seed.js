// seed.js
// Database seeder script for LabVault demo environment

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Asset = require('./models/Asset');
const Request = require('./models/Request');
const Maintenance = require('./models/Maintenance');

const seedDatabase = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/labvault';
    await mongoose.connect(connUri);
    console.log('✓ Connected to MongoDB for seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Asset.deleteMany({}),
      Request.deleteMany({}),
      Maintenance.deleteMany({})
    ]);
    console.log('✓ Cleared previous database records.');

    // 1. Create Core Users
    console.log('Creating demo user accounts...');
    const adminUser = new User({
      name: 'Dr. Arthur Sterling',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Central Laboratory Directorate'
    });
    await adminUser.save();

    const labUser = new User({
      name: 'Elena Rostova',
      email: 'lab@example.com',
      password: 'Lab@123',
      role: 'labIncharge',
      department: 'Electronics & Instrumentation Lab'
    });
    await labUser.save();

    const studentUser = new User({
      name: 'Marcus Vance',
      email: 'student@example.com',
      password: 'Student@123',
      role: 'requester',
      department: 'Electrical & Computer Engineering'
    });
    await studentUser.save();

    console.log('✓ Seeded 3 demo user accounts:');
    console.log('  - Admin:       admin@example.com / Admin@123');
    console.log('  - Lab Incharge: lab@example.com / Lab@123');
    console.log('  - Requester:   student@example.com / Student@123');

    // 2. Create 10 Sample Lab Assets
    console.log('Seeding 10 realistic laboratory equipment assets...');
    const sampleAssets = [
      {
        assetTag: 'LAB-OSC-001',
        name: 'Digital Storage Oscilloscope 100MHz (4-Channel)',
        category: 'Testing & Measurement',
        location: 'Electronics Lab - Bench 4',
        condition: 'Good',
        totalQuantity: 6,
        availableQuantity: 4,
        issuedQuantity: 2,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Rigol DS1054Z 100MHz 4-channel digital storage oscilloscope with real-time waveform capture and USB host interface.'
      },
      {
        assetTag: 'LAB-DMM-002',
        name: 'True-RMS Digital Multimeter',
        category: 'Testing & Measurement',
        location: 'Instrumentation Lab - Rack A',
        condition: 'Good',
        totalQuantity: 15,
        availableQuantity: 12,
        issuedQuantity: 3,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Fluke 87V industrial multimeter offering accurate frequency, voltage, and capacitance measurements.'
      },
      {
        assetTag: 'LAB-ARD-003',
        name: 'Arduino Uno R3 Microcontroller Board',
        category: 'Prototyping',
        location: 'Embedded Systems Lab - Cabinet 2',
        condition: 'Good',
        totalQuantity: 25,
        availableQuantity: 20,
        issuedQuantity: 5,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'ATmega328P based microcontroller kit complete with USB interface for robotics and micro-sensor experimentation.'
      },
      {
        assetTag: 'LAB-RPI-004',
        name: 'Raspberry Pi 4 Model B (4GB RAM)',
        category: 'Computing',
        location: 'IoT Research Lab - Drawer 3',
        condition: 'Good',
        totalQuantity: 12,
        availableQuantity: 8,
        issuedQuantity: 4,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Quad-core 64-bit single board computer with dual micro-HDMI 4K displays and Gigabit Ethernet.'
      },
      {
        assetTag: 'LAB-SLD-005',
        name: 'ESD-Safe Digital Soldering Station 60W',
        category: 'Soldering',
        location: 'Hardware Fabrication Lab - Bench 1',
        condition: 'Good',
        totalQuantity: 10,
        availableQuantity: 9,
        issuedQuantity: 1,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Hakko FX-888D digital temperature controlled soldering station with ceramic heating element.'
      },
      {
        assetTag: 'LAB-PWR-006',
        name: 'Triple Output DC Regulated Power Supply 30V/5A',
        category: 'Electronics',
        location: 'Electronics Lab - Bench 6',
        condition: 'Good',
        totalQuantity: 8,
        availableQuantity: 7,
        issuedQuantity: 1,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Linear programmable benchtop DC power supply featuring dual isolated 30V/5A outputs and auxiliary 5V/3A.'
      },
      {
        assetTag: 'LAB-FGN-007',
        name: '25MHz Arbitrary Function Generator',
        category: 'Testing & Measurement',
        location: 'Signals Lab - Bench 2',
        condition: 'Good',
        totalQuantity: 6,
        availableQuantity: 5,
        issuedQuantity: 1,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Dual channel DDS arbitrary waveform function generator with sine, square, ramp, pulse, and noise modulation.'
      },
      {
        assetTag: 'LAB-SCL-008',
        name: 'High-Precision Analytical Weighing Scale (0.1mg)',
        category: 'General Lab',
        location: 'Materials Analysis Lab - Room 102',
        condition: 'Good',
        totalQuantity: 4,
        availableQuantity: 3,
        issuedQuantity: 0,
        damagedQuantity: 1,
        lostQuantity: 0,
        description: 'Electromagnetic force compensation precision analytical balance with draft shield chamber.'
      },
      {
        assetTag: 'LAB-BRD-009',
        name: 'Solderless Breadboard 830 Points & Jumper Kit',
        category: 'Prototyping',
        location: 'Introductory Lab - Bin 12',
        condition: 'Good',
        totalQuantity: 30,
        availableQuantity: 30,
        issuedQuantity: 0,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'Standard 830 tie-point prototyping breadboard with 65-piece flexible male-to-male jumper wires.'
      },
      {
        assetTag: 'LAB-LOG-010',
        name: '16-Channel 100MHz USB Logic Analyzer',
        category: 'Electronics',
        location: 'Embedded Systems Lab - Cabinet 1',
        condition: 'Good',
        totalQuantity: 5,
        availableQuantity: 4,
        issuedQuantity: 1,
        damagedQuantity: 0,
        lostQuantity: 0,
        description: 'High-speed digital signal capture instrument with protocol decoders for I2C, SPI, UART, and CAN bus.'
      }
    ];

    const createdAssets = await Asset.insertMany(sampleAssets);
    console.log(`✓ Seeded ${createdAssets.length} lab equipment assets.`);

    // 3. Create Sample Requests & Issues
    console.log('Seeding sample requisitions across various lifecycle statuses...');
    const now = new Date();

    const oscAsset = createdAssets.find(a => a.assetTag === 'LAB-OSC-001');
    const dmmAsset = createdAssets.find(a => a.assetTag === 'LAB-DMM-002');
    const rpiAsset = createdAssets.find(a => a.assetTag === 'LAB-RPI-004');
    const ardAsset = createdAssets.find(a => a.assetTag === 'LAB-ARD-003');
    const sclAsset = createdAssets.find(a => a.assetTag === 'LAB-SCL-008');

    // Overdue issue (due 3 days ago)
    const overdueReturnDate = new Date();
    overdueReturnDate.setDate(now.getDate() - 3);

    const activeReturnDate = new Date();
    activeReturnDate.setDate(now.getDate() + 5);

    const requestsData = [
      // 1. Pending Request
      {
        requester: studentUser._id,
        asset: ardAsset._id,
        quantity: 2,
        purpose: 'IoT Weather Station course capstone project.',
        expectedReturnDate: activeReturnDate,
        requestDate: new Date(),
        status: 'Pending'
      },
      // 2. Approved Request (ready for handover)
      {
        requester: studentUser._id,
        asset: dmmAsset._id,
        quantity: 1,
        purpose: 'Circuit impedance calibration in Room 302.',
        expectedReturnDate: activeReturnDate,
        requestDate: new Date(),
        status: 'Approved',
        approvedBy: labUser._id,
        approvedAt: new Date()
      },
      // 3. Active Issued Loan
      {
        requester: studentUser._id,
        asset: oscAsset._id,
        quantity: 1,
        purpose: 'High frequency PWM signal inspection for robotics motor controller.',
        expectedReturnDate: activeReturnDate,
        requestDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'Issued',
        approvedBy: labUser._id,
        approvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        issuedBy: labUser._id,
        issuedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      // 4. OVERDUE Loan (Automatic detection demonstration!)
      {
        requester: studentUser._id,
        asset: rpiAsset._id,
        quantity: 1,
        purpose: 'Autonomous drone flight computer test benchmarking.',
        expectedReturnDate: overdueReturnDate,
        requestDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        status: 'Issued',
        approvedBy: labUser._id,
        approvedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        issuedBy: labUser._id,
        issuedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      },
      // 5. Successfully Returned (OK)
      {
        requester: studentUser._id,
        asset: dmmAsset._id,
        quantity: 1,
        purpose: 'Laboratory Midterm Exam 2 practical verification.',
        expectedReturnDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        requestDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        status: 'Returned',
        approvedBy: labUser._id,
        approvedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        issuedBy: labUser._id,
        issuedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        returnedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        returnCondition: 'OK',
        returnRemarks: 'Returned in pristine condition with all test leads.'
      },
      // 6. Returned Damaged (Triggered maintenance)
      {
        requester: studentUser._id,
        asset: sclAsset._id,
        quantity: 1,
        purpose: 'Chemical gravimetric measurement for nanomaterials lab.',
        expectedReturnDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        requestDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'Returned',
        approvedBy: labUser._id,
        approvedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        issuedBy: labUser._id,
        issuedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        returnedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        returnCondition: 'Damaged',
        returnRemarks: 'Draft shield glass cracked during experiment. Calibration sensor error displayed.'
      }
    ];

    await Request.insertMany(requestsData);
    console.log('✓ Seeded sample requests (Pending, Approved, Active Issued, Overdue, and Returned).');

    // 4. Create Maintenance Log for the damaged scale
    const sampleMaintenance = [
      {
        asset: sclAsset._id,
        serviceDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        description: 'Replaced broken acrylic draft shield and recalibrated electromagnetic force cell.',
        cost: 145.00,
        status: 'In Progress',
        performedBy: 'Mettler-Toledo Certified Service Partner',
        notes: 'Waiting for replacement sensor board delivery.'
      },
      {
        asset: oscAsset._id,
        serviceDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        description: 'Annual ISO/IEC 17025 laboratory calibration and firmware upgrade to v00.04.05.',
        cost: 85.00,
        status: 'Completed',
        performedBy: 'Rigol Technical Support',
        notes: 'Passed all bandwidth and timebase verification tests.'
      }
    ];

    await Maintenance.insertMany(sampleMaintenance);
    console.log('✓ Seeded historical and active maintenance records.');

    console.log('==================================================');
    console.log('🎉 LABVAULT DATABASE SEEDING COMPLETED SUCCESSFULLY');
    console.log('==================================================');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seeding error:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. CREATE ADMIN USERS
    console.log('📝 Creating admin users...');
    const adminUsers = [
      { email: 'karya.ai.admin@gmail.com', displayName: 'Admin User', password: 'AdminPassword123!' },
      { email: 'karya.secret.admin@gmail.com', displayName: 'Secret Admin', password: 'SecretAdmin123!' },
    ];

    for (const admin of adminUsers) {
      const existing = await prisma.user.findUnique({ where: { email: admin.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(admin.password, 10);
        await prisma.user.create({
          data: {
            uid: Math.random().toString(36).substring(2, 11),
            email: admin.email,
            displayName: admin.displayName,
            role: 'admin',
            isApproved: true,
            passwordHash: hashedPassword,
          },
        });
        console.log(`✅ Created admin: ${admin.email}`);
      }
    }

    // 2. CREATE EMPLOYEE/COUNSELOR USERS
    console.log('\n📝 Creating counselor/employee users...');
    const employees = [
      { email: 'mkarthikeya24@gmail.com', displayName: 'Karthik', password: 'Consultancy@2026', uid: 'emp_karthik' },
      { email: 'kbsn1170@gmail.com', displayName: 'Niteesh', password: 'Consultancy@2026', uid: 'emp_niteesh' },
      { email: 'kesamasetty.dev@gmail.com', displayName: 'Kesamasetty', password: 'Consultancy@2026', uid: 'emp_kesa' },
    ];

    const employeeMap = {};
    for (const emp of employees) {
      const existing = await prisma.user.findUnique({ where: { email: emp.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(emp.password, 10);
        const user = await prisma.user.create({
          data: {
            uid: emp.uid,
            email: emp.email,
            displayName: emp.displayName,
            role: 'employee',
            isApproved: true,
            passwordHash: hashedPassword,
          },
        });
        employeeMap[emp.email] = user.uid;
        console.log(`✅ Created counselor: ${emp.displayName}`);
      } else {
        employeeMap[emp.email] = existing.uid;
      }
    }

    // 3. CREATE CLIENT USERS (CANDIDATES)
    console.log('\n📝 Creating candidate/client users...');
    const candidates = [
      {
        email: 'yaswanth.testing@gmail.com',
        displayName: 'Yaswanth Kumar',
        password: 'CandidatePass123!',
        firstName: 'Yaswanth',
        lastName: 'Kumar',
        assignedEmployee: 'mkarthikeya24@gmail.com',
        status: 'active',
        data: {
          experience: '4 years',
          domain: 'Senior Software Engineer',
          currentCompany: 'Tech Startup XYZ',
          currentCTC: '12 LPA',
          expectedCTC: '15 LPA',
          preferredLocation: 'Hyderabad',
          phone: '+91-9999988888',
          permanentAddress: 'Hyderabad, Telangana',
          targetRoles: ['Senior Backend Engineer', 'Tech Lead', 'DevOps Engineer'],
          education: {
            degree: 'B.Tech Computer Science',
            college: 'IIT Hyderabad',
            year: '2020',
          },
          skills: 'Node.js, Python, Docker, Kubernetes, AWS, PostgreSQL',
          linkedinUrl: 'https://linkedin.com/in/yaswanth',
          portfolioUrl: 'https://github.com/yaswanth',
        },
      },
      {
        email: 'priya.sharma@gmail.com',
        displayName: 'Priya Sharma',
        password: 'CandidatePass123!',
        firstName: 'Priya',
        lastName: 'Sharma',
        assignedEmployee: 'kbsn1170@gmail.com',
        status: 'active',
        data: {
          experience: '3 years',
          domain: 'Full Stack Developer',
          currentCompany: 'StartUp ABC',
          currentCTC: '10 LPA',
          expectedCTC: '13 LPA',
          preferredLocation: 'Bangalore',
          phone: '+91-9999977777',
          permanentAddress: 'Bangalore, Karnataka',
          targetRoles: ['React Developer', 'Full Stack Engineer'],
          education: {
            degree: 'B.Tech Information Technology',
            college: 'VIT University',
            year: '2021',
          },
          skills: 'React, Node.js, MongoDB, AWS',
          linkedinUrl: 'https://linkedin.com/in/priya',
        },
      },
      {
        email: 'rajesh.patel@gmail.com',
        displayName: 'Rajesh Patel',
        password: 'CandidatePass123!',
        firstName: 'Rajesh',
        lastName: 'Patel',
        assignedEmployee: 'kesamasetty.dev@gmail.com',
        status: 'active',
        data: {
          experience: '5 years',
          domain: 'Data Engineer',
          currentCompany: 'Data Analytics Corp',
          currentCTC: '14 LPA',
          expectedCTC: '18 LPA',
          preferredLocation: 'Pune',
          phone: '+91-9999966666',
          permanentAddress: 'Pune, Maharashtra',
          targetRoles: ['Data Engineer', 'Data Architect', 'Analytics Engineer'],
          education: {
            degree: 'M.Tech Data Science',
            college: 'IIIT Hyderabad',
            year: '2019',
          },
          skills: 'Python, Spark, Hadoop, SQL, AWS',
          linkedinUrl: 'https://linkedin.com/in/rajesh',
        },
      },
      {
        email: 'neha.gupta@gmail.com',
        displayName: 'Neha Gupta',
        password: 'CandidatePass123!',
        firstName: 'Neha',
        lastName: 'Gupta',
        assignedEmployee: 'mkarthikeya24@gmail.com',
        status: 'active',
        data: {
          experience: '2 years',
          domain: 'QA Engineer',
          currentCompany: 'Testing Solutions Ltd',
          currentCTC: '8 LPA',
          expectedCTC: '10 LPA',
          preferredLocation: 'Mumbai',
          phone: '+91-9999955555',
          permanentAddress: 'Mumbai, Maharashtra',
          targetRoles: ['QA Automation Engineer', 'SDET'],
          education: {
            degree: 'B.Tech Electronics',
            college: 'Pune Institute of Technology',
            year: '2022',
          },
          skills: 'Selenium, Python, Java, TestNG',
          linkedinUrl: 'https://linkedin.com/in/neha',
        },
      },
    ];

    const clientMap = {};
    for (const candidate of candidates) {
      const existing = await prisma.user.findUnique({ where: { email: candidate.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(candidate.password, 10);
        const uid = `client_${Math.random().toString(36).substring(2, 9)}`;
        
        const user = await prisma.user.create({
          data: {
            uid,
            email: candidate.email,
            displayName: candidate.displayName,
            role: 'client',
            isApproved: true,
            passwordHash: hashedPassword,
          },
        });

        const assignedEmpId = employeeMap[candidate.assignedEmployee] || null;
        const client = await prisma.client.create({
          data: {
            uid,
            assignedEmployeeId: assignedEmpId,
            status: candidate.status,
            applicationData: candidate.data,
          },
        });

        clientMap[candidate.email] = { uid, id: client.id };
        console.log(`✅ Created candidate: ${candidate.displayName}`);
      } else {
        const existingClient = await prisma.client.findUnique({ where: { uid: existing.uid } });
        clientMap[candidate.email] = { uid: existing.uid, id: existingClient?.id };
      }
    }

    // 4. CREATE JOB APPLICATIONS
    console.log('\n📝 Creating job applications...');
    const jobs = [
      {
        clientEmail: 'yaswanth.testing@gmail.com',
        company: 'ZEPTO',
        role: 'Senior Service Now Developer',
        status: 'Applied',
        appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Hyderabad',
        salary: '11 LPA',
        jobUrl: 'https://www.zepto.com/careers',
      },
      {
        clientEmail: 'yaswanth.testing@gmail.com',
        company: 'Google',
        role: 'Backend Engineer',
        status: 'Interview',
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Bangalore',
        salary: '30+ LPA',
        jobUrl: 'https://careers.google.com',
      },
      {
        clientEmail: 'yaswanth.testing@gmail.com',
        company: 'Microsoft',
        role: 'Cloud Architect',
        status: 'Assessment',
        appliedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Hyderabad',
        salary: '25-30 LPA',
        jobUrl: 'https://careers.microsoft.com',
      },
      {
        clientEmail: 'priya.sharma@gmail.com',
        company: 'Amazon',
        role: 'React Developer',
        status: 'Applied',
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Bangalore',
        salary: '16-18 LPA',
        jobUrl: 'https://amazon.jobs',
      },
      {
        clientEmail: 'rajesh.patel@gmail.com',
        company: 'Meta',
        role: 'Data Engineer',
        status: 'Selected',
        appliedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Pune',
        salary: '20-22 LPA',
        jobUrl: 'https://meta.careers',
      },
      {
        clientEmail: 'rajesh.patel@gmail.com',
        company: 'Databricks',
        role: 'Analytics Engineer',
        status: 'Interview',
        appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Remote',
        salary: '18-20 LPA',
        jobUrl: 'https://databricks.com/careers',
      },
      {
        clientEmail: 'neha.gupta@gmail.com',
        company: 'Accenture',
        role: 'QA Automation',
        status: 'Applied',
        appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Mumbai',
        salary: '11-13 LPA',
        jobUrl: 'https://accenture.com/careers',
      },
    ];

    for (const job of jobs) {
      const clientInfo = clientMap[job.clientEmail];
      if (clientInfo) {
        await prisma.clientJob.create({
          data: {
            clientId: clientInfo.id,
            company: job.company,
            role: job.role,
            status: job.status,
            appliedDate: job.appliedDate,
            location: job.location,
            salary: job.salary,
            jobUrl: job.jobUrl,
          },
        });
        console.log(`✅ Created job: ${job.company} - ${job.role} for ${job.clientEmail}`);
      }
    }

    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();

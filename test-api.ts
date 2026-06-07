// Test script for backend API verification
// Run with: npx tsx test-api.ts

const BASE = "http://localhost:3000";

async function testAPI() {
  console.log("=== BACKEND API TEST SUITE ===\n");

  // 1. Health Check
  console.log("1. Health Check...");
  try {
    const health = await fetch(`${BASE}/api/health`);
    const hData = await health.json();
    console.log(`   ✅ Status: ${hData.status}, DB: ${hData.db}\n`);
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
    return;
  }

  // 2. Register Client
  console.log("2. Registering client (repanajagadish@gmail.com)...");
  let clientToken = "";
  let clientUid = "";
  try {
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "repanajagadish@gmail.com",
        password: "RepanaJagadish02-pass",
        displayName: "Repana Jagadish",
        role: "client"
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok) {
      console.log(`   ⚠️  Registration returned ${regRes.status}: ${JSON.stringify(regData)}`);
      // If already registered, try login
      if (regData.error?.includes("already registered")) {
        console.log("   Trying login instead...");
        const loginRes = await fetch(`${BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "repanajagadish@gmail.com",
            password: "RepanaJagadish02-pass"
          })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          console.log(`   ❌ Login FAILED: ${JSON.stringify(loginData)}\n`);
          return;
        }
        clientToken = loginData.token;
        clientUid = loginData.user.uid;
        console.log(`   ✅ Login OK. UID: ${clientUid}\n`);
      } else {
        console.log(`   ❌ Registration FAILED\n`);
        return;
      }
    } else {
      clientToken = regData.token;
      clientUid = regData.user.uid;
      console.log(`   ✅ Registered. UID: ${clientUid}\n`);
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
    return;
  }

  // 3. Get /api/auth/me for client
  console.log("3. Fetching /api/auth/me for client...");
  try {
    const meRes = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const meData = await meRes.json();
    if (!meRes.ok) {
      console.log(`   ❌ FAILED ${meRes.status}: ${JSON.stringify(meData)}\n`);
    } else {
      console.log(`   ✅ User: ${meData.user.email}, Role: ${meData.user.role}, Approved: ${meData.user.isApproved}`);
      console.log(`   Client profile status: ${meData.clientProfile?.status || 'NOT FOUND'}\n`);
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
  }

  // 4. Update client profile with application data
  console.log("4. Updating client profile with application data...");
  try {
    const updateRes = await fetch(`${BASE}/api/clients/${clientUid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`
      },
      body: JSON.stringify({
        applicationData: {
          firstName: "Repana",
          lastName: "Jagadish",
          experience: "Experienced",
          currentCompany: "LTI Mindtree",
          currentCTC: "16 LPA",
          expectedCTC: "24 LPA (negotiable)",
          location: "Bangalore",
          preferredLocation: "Bangalore",
          genuineExperience: "1 yr 9 months",
          fakeExperience: "2 years 3 months",
          passedOutYear: "2017",
          domain: "DevOps",
          noticePeriod: "Immediate join"
        },
        status: "pending_approval"
      })
    });
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      console.log(`   ❌ FAILED ${updateRes.status}: ${JSON.stringify(updateData)}\n`);
    } else {
      console.log(`   ✅ Profile updated. Status: ${updateData.status}\n`);
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
  }

  // 5. Login as Consultant (Karthik)
  console.log("5. Logging in as consultant (mkarthikeya24@gmail.com)...");
  let consultantToken = "";
  try {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "mkarthikeya24@gmail.com",
        password: "Consultancy@2026"
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log(`   ❌ Login FAILED ${loginRes.status}: ${JSON.stringify(loginData)}\n`);
      return;
    }
    consultantToken = loginData.token;
    console.log(`   ✅ Logged in. Role: ${loginData.user.role}, UID: ${loginData.user.uid}\n`);
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
    return;
  }

  // 6. Fetch all clients as consultant
  console.log("6. Fetching /api/clients as consultant...");
  try {
    const clientsRes = await fetch(`${BASE}/api/clients`, {
      headers: { Authorization: `Bearer ${consultantToken}` }
    });
    const clientsList = await clientsRes.json();
    if (!clientsRes.ok) {
      console.log(`   ❌ FAILED ${clientsRes.status}: ${JSON.stringify(clientsList)}\n`);
    } else {
      console.log(`   ✅ Found ${clientsList.length} client(s):`);
      for (const c of clientsList) {
        const name = c.applicationData ? `${c.applicationData.firstName} ${c.applicationData.lastName}` : "No name";
        console.log(`      - ${name} (uid: ${c.uid}, status: ${c.status})`);
      }
      console.log();
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
  }

  // 7. Approve the client
  console.log("7. Approving client (setting status to 'active')...");
  try {
    const approveRes = await fetch(`${BASE}/api/clients/${clientUid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${consultantToken}`
      },
      body: JSON.stringify({ status: "active" })
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok) {
      console.log(`   ❌ FAILED ${approveRes.status}: ${JSON.stringify(approveData)}\n`);
    } else {
      console.log(`   ✅ Client approved! Status: ${approveData.status}\n`);
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
  }

  // 8. Login as Admin
  console.log("8. Logging in as admin (karya.ai.admin@gmail.com)...");
  try {
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "karya.ai.admin@gmail.com",
        password: "AdminPassword123!"
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log(`   ❌ Login FAILED ${loginRes.status}: ${JSON.stringify(loginData)}\n`);
    } else {
      console.log(`   ✅ Logged in as admin. Role: ${loginData.user.role}\n`);
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
  }

  // 9. Verify client profile after approval
  console.log("9. Verifying client profile after approval...");
  try {
    const meRes = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    const meData = await meRes.json();
    if (!meRes.ok) {
      console.log(`   ❌ FAILED ${meRes.status}: ${JSON.stringify(meData)}\n`);
    } else {
      console.log(`   ✅ Client status: ${meData.clientProfile?.status}`);
      console.log(`   ✅ Application Data: ${JSON.stringify(meData.clientProfile?.applicationData, null, 2)}\n`);
    }
  } catch (e: any) {
    console.log(`   ❌ FAILED: ${e.message}\n`);
  }

  console.log("=== ALL TESTS COMPLETE ===");
}

testAPI();

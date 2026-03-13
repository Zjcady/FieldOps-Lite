import { PrismaClient } from "@prisma/client";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.portalMessage.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.material.deleteMany();
  await prisma.note.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.task.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.permit.deleteMany();
  await prisma.job.deleteMany();
  await prisma.crewMember.deleteMany();
  await prisma.crew.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // ─── Company ───
  const companyId = uuid();
  await prisma.company.create({
    data: {
      id: companyId,
      name: "BuildRight Construction LLC",
      slug: "buildright",
      phone: "(407) 555-0100",
      email: "office@buildright.com",
      address: "1200 Commerce Park Dr, Orlando, FL 32826",
    },
  });

  // ─── Users ───
  const userIds = {
    sarah: uuid(),
    mike: uuid(),
    marcus: uuid(),
    diana: uuid(),
    james: uuid(),
  };

  await prisma.user.createMany({
    data: [
      { id: userIds.sarah, companyId, email: "sarah@buildright.com", name: "Sarah Chen", role: "owner", phone: "(407) 555-0101" },
      { id: userIds.mike, companyId, email: "mike@buildright.com", name: "Mike Rodriguez", role: "ops_manager", phone: "(407) 555-0102" },
      { id: userIds.marcus, companyId, email: "marcus@buildright.com", name: "Marcus Thompson", role: "crew_leader", phone: "(407) 555-0103" },
      { id: userIds.diana, companyId, email: "diana@buildright.com", name: "Diana Rivera", role: "crew_leader", phone: "(407) 555-0104" },
      { id: userIds.james, companyId, email: "james@buildright.com", name: "James Kim", role: "crew_member", phone: "(407) 555-0105" },
    ],
  });

  // ─── Crews ───
  const crewIds = { alpha: uuid(), beta: uuid(), gamma: uuid(), delta: uuid() };

  await prisma.crew.createMany({
    data: [
      { id: crewIds.alpha, companyId, name: "Crew Alpha", color: "#3b82f6" },
      { id: crewIds.beta, companyId, name: "Crew Beta", color: "#22c55e" },
      { id: crewIds.gamma, companyId, name: "Crew Gamma", color: "#a78bfa" },
      { id: crewIds.delta, companyId, name: "Crew Delta", color: "#f59e0b" },
    ],
  });

  await prisma.crewMember.createMany({
    data: [
      { crewId: crewIds.alpha, userId: userIds.marcus, role: "lead" },
      { crewId: crewIds.alpha, userId: userIds.james, role: "member" },
      { crewId: crewIds.beta, userId: userIds.diana, role: "lead" },
      { crewId: crewIds.gamma, userId: userIds.james, role: "member" },
    ],
  });

  // ─── Customers ───
  const custIds = { martinez: uuid(), greenfield: uuid(), rivera: uuid(), thornwood: uuid(), sanders: uuid(), johnson: uuid() };

  await prisma.customer.createMany({
    data: [
      { id: custIds.martinez, companyId, name: "Linda Martinez", email: "linda.martinez@email.com", phone: "(863) 555-0201", portalToken: "mrt-x7f2k9" },
      { id: custIds.greenfield, companyId, name: "Greenfield HOA", email: "board@greenfieldHOA.com", phone: "(407) 555-0202", portalToken: "gfh-a3m1p5" },
      { id: custIds.rivera, companyId, name: "Carlos Rivera", email: "carlos.rivera@email.com", phone: "(407) 555-0203", portalToken: "rvr-b8n4q2" },
      { id: custIds.thornwood, companyId, name: "Thornwood Estates HOA", email: "mgmt@thornwood.com", phone: "(813) 555-0204", portalToken: "thw-c5k7r8" },
      { id: custIds.sanders, companyId, name: "Tom Sanders", email: "tom.sanders@email.com", phone: "(352) 555-0205", portalToken: "snd-d2j9s4" },
      { id: custIds.johnson, companyId, name: "Sarah Johnson", email: "sarah.j@email.com", phone: "(407) 555-0206", portalToken: "jhn-e6h3t1" },
    ],
  });

  // ─── Properties ───
  const propIds = { martinez: uuid(), greenfield: uuid(), rivera: uuid(), thornwood: uuid(), sanders: uuid(), johnson: uuid() };

  await prisma.property.createMany({
    data: [
      { id: propIds.martinez, companyId, customerId: custIds.martinez, address: "4821 Oak Ridge Blvd", city: "Lakeland", state: "FL", zip: "33801" },
      { id: propIds.greenfield, companyId, customerId: custIds.greenfield, address: "800 Greenfield Dr", city: "Kissimmee", state: "FL", zip: "34741" },
      { id: propIds.rivera, companyId, customerId: custIds.rivera, address: "1240 Cypress Way", city: "Orlando", state: "FL", zip: "32801" },
      { id: propIds.thornwood, companyId, customerId: custIds.thornwood, address: "3200 Thornwood Ln", city: "Tampa", state: "FL", zip: "33602" },
      { id: propIds.sanders, companyId, customerId: custIds.sanders, address: "9100 Pine Meadow Ct", city: "Clermont", state: "FL", zip: "34711" },
      { id: propIds.johnson, companyId, customerId: custIds.johnson, address: "567 Magnolia Ave", city: "Winter Park", state: "FL", zip: "32789" },
    ],
  });

  // ─── Vendors ───
  const vendorIds = { lumber: uuid(), masonry: uuid() };

  await prisma.vendor.createMany({
    data: [
      { id: vendorIds.lumber, companyId, name: "Central FL Lumber & Supply", contact: "Bob Harris", phone: "(407) 555-0301", email: "orders@cfllumber.com", category: "lumber" },
      { id: vendorIds.masonry, companyId, name: "SunCoast Masonry Supply", contact: "Elena Vasquez", phone: "(813) 555-0302", email: "sales@suncoastmasonry.com", category: "masonry" },
    ],
  });

  // ─── Jobs ───
  const now = new Date();
  const d = (daysOffset: number) => new Date(now.getTime() + daysOffset * 86400000);

  const jobIds = {
    martinezPatio: uuid(),
    greenfieldMow: uuid(),
    riveraPool: uuid(),
    thornwoodFence: uuid(),
    sandersLanai: uuid(),
    johnsonGarden: uuid(),
    martinezDriveway: uuid(),
    riveraLighting: uuid(),
  };

  const jobs = [
    {
      id: jobIds.martinezPatio,
      companyId, customerId: custIds.martinez, propertyId: propIds.martinez, crewId: crewIds.alpha,
      jobNumber: "JOB-2026-001", title: "Martinez Residence — Patio Install",
      description: "Full paver patio installation with polymeric sand and sealing. 400 sq ft area.",
      type: "project", category: "Hardscape", status: "active", priority: "high",
      scheduledDate: d(-5), startDate: d(-3), estimatedEnd: d(3),
      estimatedHours: 48, actualHours: 28, estimatedCost: 12500, actualCost: 8200,
      progress: 65, address: "4821 Oak Ridge Blvd, Lakeland FL",
    },
    {
      id: jobIds.greenfieldMow,
      companyId, customerId: custIds.greenfield, propertyId: propIds.greenfield, crewId: crewIds.beta,
      jobNumber: "JOB-2026-002", title: "Greenfield HOA — Weekly Mow",
      description: "Weekly lawn mowing service for Greenfield HOA common areas.",
      type: "recurring", category: "Maintenance", status: "scheduled", priority: "medium",
      isRecurring: true, scheduledDate: d(0), estimatedEnd: d(0),
      estimatedHours: 4, estimatedCost: 450,
      progress: 0, address: "800 Greenfield Dr, Kissimmee FL",
    },
    {
      id: jobIds.riveraPool,
      companyId, customerId: custIds.rivera, propertyId: propIds.rivera,
      jobNumber: "JOB-2026-003", title: "Rivera Pool Deck — Pavers",
      description: "Pool deck paver installation. 600 sq ft travertine pavers.",
      type: "project", category: "Hardscape", status: "waiting_permit", priority: "high",
      scheduledDate: d(5), estimatedEnd: d(20),
      estimatedHours: 60, estimatedCost: 18500,
      progress: 0, address: "1240 Cypress Way, Orlando FL",
    },
    {
      id: jobIds.thornwoodFence,
      companyId, customerId: custIds.thornwood, propertyId: propIds.thornwood, crewId: crewIds.gamma,
      jobNumber: "JOB-2026-004", title: "Thornwood Estates — Privacy Fence",
      description: "200 LF privacy fence installation, 6ft cedar with aluminum posts.",
      type: "project", category: "Fencing", status: "scheduled", priority: "medium",
      scheduledDate: d(1), estimatedEnd: d(10),
      estimatedHours: 40, estimatedCost: 14200,
      progress: 0, address: "3200 Thornwood Ln, Tampa FL",
    },
    {
      id: jobIds.sandersLanai,
      companyId, customerId: custIds.sanders, propertyId: propIds.sanders, crewId: crewIds.alpha,
      jobNumber: "JOB-2026-005", title: "Sanders Lanai Enclosure",
      description: "Full lanai screen enclosure, 20x30 ft with concrete footer.",
      type: "project", category: "Lanai", status: "active", priority: "medium",
      scheduledDate: d(-14), startDate: d(-12), estimatedEnd: d(2),
      estimatedHours: 56, actualHours: 48, estimatedCost: 9800, actualCost: 8600,
      progress: 88, address: "9100 Pine Meadow Ct, Clermont FL",
    },
    {
      id: jobIds.johnsonGarden,
      companyId, customerId: custIds.johnson, propertyId: propIds.johnson, crewId: crewIds.beta,
      jobNumber: "JOB-2026-006", title: "Johnson Garden Renovation",
      description: "Front yard landscaping overhaul with new plantings and mulch beds.",
      type: "project", category: "Landscaping", status: "completed", priority: "low",
      scheduledDate: d(-21), startDate: d(-20), completedDate: d(-3), estimatedEnd: d(-3),
      estimatedHours: 16, actualHours: 14, estimatedCost: 3200, actualCost: 2900,
      progress: 100, address: "567 Magnolia Ave, Winter Park FL",
    },
    {
      id: jobIds.martinezDriveway,
      companyId, customerId: custIds.martinez, propertyId: propIds.martinez,
      jobNumber: "JOB-2026-007", title: "Martinez — Driveway Extension",
      description: "Extend existing driveway by 12ft with matching pavers.",
      type: "project", category: "Hardscape", status: "waiting_materials", priority: "medium",
      scheduledDate: d(7), estimatedEnd: d(14),
      estimatedHours: 24, estimatedCost: 6800,
      progress: 0, address: "4821 Oak Ridge Blvd, Lakeland FL",
    },
    {
      id: jobIds.riveraLighting,
      companyId, customerId: custIds.rivera, propertyId: propIds.rivera, crewId: crewIds.delta,
      jobNumber: "JOB-2026-008", title: "Rivera — Landscape Lighting",
      description: "Low-voltage LED path and accent lighting package, 18 fixtures.",
      type: "project", category: "Lighting", status: "invoiced", priority: "low",
      scheduledDate: d(-30), startDate: d(-28), completedDate: d(-10), estimatedEnd: d(-10),
      estimatedHours: 12, actualHours: 10, estimatedCost: 4200, actualCost: 3900,
      progress: 100, address: "1240 Cypress Way, Orlando FL",
    },
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }

  // ─── Tasks ───
  const taskSets: Record<string, { title: string; status: string; completedAt?: Date }[]> = {
    [jobIds.martinezPatio]: [
      { title: "Site preparation & excavation", status: "completed", completedAt: d(-3) },
      { title: "Base compaction", status: "completed", completedAt: d(-2) },
      { title: "Sand bedding layer", status: "completed", completedAt: d(-1) },
      { title: "Paver installation", status: "in_progress" },
      { title: "Polymeric sand & sealing", status: "pending" },
      { title: "Final cleanup & walkthrough", status: "pending" },
    ],
    [jobIds.sandersLanai]: [
      { title: "Footer excavation", status: "completed", completedAt: d(-12) },
      { title: "Concrete footer pour", status: "completed", completedAt: d(-10) },
      { title: "Frame assembly", status: "completed", completedAt: d(-7) },
      { title: "Screen panel installation", status: "in_progress" },
      { title: "Door hardware & finishing", status: "pending" },
    ],
    [jobIds.thornwoodFence]: [
      { title: "Survey & mark property lines", status: "pending" },
      { title: "Post hole digging", status: "pending" },
      { title: "Set aluminum posts", status: "pending" },
      { title: "Install cedar panels", status: "pending" },
      { title: "Gates & hardware", status: "pending" },
    ],
    [jobIds.johnsonGarden]: [
      { title: "Remove existing plantings", status: "completed", completedAt: d(-19) },
      { title: "Soil amendment & grading", status: "completed", completedAt: d(-17) },
      { title: "Plant installation", status: "completed", completedAt: d(-8) },
      { title: "Mulch & edging", status: "completed", completedAt: d(-4) },
    ],
  };

  for (const [jobId, tasks] of Object.entries(taskSets)) {
    for (let i = 0; i < tasks.length; i++) {
      await prisma.task.create({
        data: { jobId, title: tasks[i].title, status: tasks[i].status, sortOrder: i, completedAt: tasks[i].completedAt },
      });
    }
  }

  // ─── Photos ───
  const photoSets: Record<string, { caption: string; category: string }[]> = {
    [jobIds.martinezPatio]: [
      { caption: "Base layer compacted", category: "progress" },
      { caption: "Framing complete", category: "progress" },
      { caption: "Pavers being set", category: "progress" },
      { caption: "Layout measurement", category: "progress" },
      { caption: "Border work", category: "progress" },
    ],
    [jobIds.sandersLanai]: [
      { caption: "Footer poured", category: "progress" },
      { caption: "Frame going up", category: "progress" },
      { caption: "Screen panels ready", category: "progress" },
    ],
    [jobIds.johnsonGarden]: [
      { caption: "Before - existing yard", category: "before" },
      { caption: "New plantings installed", category: "progress" },
      { caption: "Finished garden", category: "after" },
    ],
  };

  for (const [jobId, photos] of Object.entries(photoSets)) {
    for (const photo of photos) {
      await prisma.photo.create({
        data: { jobId, url: `/api/placeholder/400/300`, caption: photo.caption, category: photo.category, uploadedBy: userIds.marcus },
      });
    }
  }

  // ─── Permits ───
  const permitIds = { thornwood: uuid(), rivera: uuid(), sanders: uuid() };

  await prisma.permit.createMany({
    data: [
      {
        id: permitIds.thornwood, companyId, jobId: jobIds.thornwoodFence,
        permitNumber: "P-2026-0479", type: "fence",
        status: "approved", jurisdiction: "Hillsborough County",
        issuedDate: d(-20), expiryDate: d(4), cost: 350,
      },
      {
        id: permitIds.rivera, companyId, jobId: jobIds.riveraPool,
        permitNumber: "P-2026-0481", type: "building",
        status: "in_review", jurisdiction: "Orange County",
        issuedDate: null, cost: 750,
        notes: "Submitted Feb 28, awaiting county review",
      },
      {
        id: permitIds.sanders, companyId, jobId: jobIds.sandersLanai,
        permitNumber: "P-2026-0465", type: "building",
        status: "approved", jurisdiction: "Lake County",
        issuedDate: d(-30), expiryDate: d(60), cost: 425,
      },
    ],
  });

  // ─── Inspections ───
  await prisma.inspection.createMany({
    data: [
      {
        companyId, jobId: jobIds.sandersLanai, permitId: permitIds.sanders,
        type: "final", status: "passed",
        scheduledDate: d(-1), completedDate: d(-1),
        inspector: "B. Torres", result: "Pass", notes: "All clear. Enclosure meets code.",
      },
      {
        companyId, jobId: jobIds.martinezPatio,
        type: "framing", status: "scheduled",
        scheduledDate: d(2), inspector: null,
      },
      {
        companyId, jobId: jobIds.thornwoodFence, permitId: permitIds.thornwood,
        type: "footing", status: "failed",
        scheduledDate: d(-14), completedDate: d(-14),
        inspector: "R. Mendez", result: "Fail", notes: "Footing depth insufficient. Needs re-inspection.",
      },
      {
        companyId, jobId: jobIds.riveraPool, permitId: permitIds.rivera,
        type: "foundation", status: "scheduled",
        scheduledDate: d(12),
      },
    ],
  });

  // ─── Materials ───
  await prisma.material.createMany({
    data: [
      { jobId: jobIds.martinezPatio, vendorId: vendorIds.masonry, name: "Travertine Pavers (Walnut)", quantity: 400, unit: "sqft", unitCost: 8.5, totalCost: 3400, status: "delivered" },
      { jobId: jobIds.martinezPatio, name: "Polymeric Sand", quantity: 12, unit: "bag", unitCost: 28, totalCost: 336, status: "delivered" },
      { jobId: jobIds.martinezPatio, name: "Paver Sealer", quantity: 5, unit: "gallon", unitCost: 45, totalCost: 225, status: "ordered" },
      { jobId: jobIds.thornwoodFence, vendorId: vendorIds.lumber, name: "Cedar Fence Boards 6ft", quantity: 200, unit: "each", unitCost: 12, totalCost: 2400, status: "ordered" },
      { jobId: jobIds.thornwoodFence, name: "Aluminum Posts 8ft", quantity: 40, unit: "each", unitCost: 35, totalCost: 1400, status: "needed" },
      { jobId: jobIds.martinezDriveway, vendorId: vendorIds.masonry, name: "Matching Pavers (Walnut)", quantity: 120, unit: "sqft", unitCost: 8.5, totalCost: 1020, status: "needed" },
    ],
  });

  // ─── Invoices ───
  await prisma.invoice.createMany({
    data: [
      {
        companyId, jobId: jobIds.johnsonGarden,
        invoiceNumber: "INV-2026-001", status: "paid",
        subtotal: 2900, tax: 203, total: 3103,
        dueDate: d(-1), paidDate: d(-1),
      },
      {
        companyId, jobId: jobIds.riveraLighting,
        invoiceNumber: "INV-2026-002", status: "sent",
        subtotal: 3900, tax: 273, total: 4173,
        dueDate: d(5),
      },
    ],
  });

  // ─── Activity Logs ───
  const logs = [
    { jobId: jobIds.martinezPatio, userId: userIds.marcus, action: "status_change", details: '{"from":"scheduled","to":"active"}', createdAt: d(-3) },
    { jobId: jobIds.martinezPatio, userId: userIds.marcus, action: "task_completed", details: '{"task":"Site preparation & excavation"}', createdAt: d(-3) },
    { jobId: jobIds.martinezPatio, userId: userIds.marcus, action: "task_completed", details: '{"task":"Base compaction"}', createdAt: d(-2) },
    { jobId: jobIds.martinezPatio, userId: userIds.marcus, action: "photo_uploaded", details: '{"caption":"Base layer compacted"}', createdAt: d(-2) },
    { jobId: jobIds.martinezPatio, userId: userIds.marcus, action: "task_completed", details: '{"task":"Sand bedding layer"}', createdAt: d(-1) },
    { jobId: jobIds.sandersLanai, userId: userIds.marcus, action: "status_change", details: '{"from":"scheduled","to":"active"}', createdAt: d(-12) },
    { jobId: jobIds.sandersLanai, userId: userIds.marcus, action: "inspection_passed", details: '{"type":"final","inspector":"B. Torres"}', createdAt: d(-1) },
    { jobId: jobIds.johnsonGarden, userId: userIds.diana, action: "status_change", details: '{"from":"active","to":"completed"}', createdAt: d(-3) },
    { jobId: jobIds.riveraLighting, userId: userIds.sarah, action: "status_change", details: '{"from":"completed","to":"invoiced"}', createdAt: d(-8) },
    { jobId: jobIds.thornwoodFence, action: "inspection_failed", details: '{"type":"footing","inspector":"R. Mendez"}', createdAt: d(-14) },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }

  // ─── Portal Messages ───
  await prisma.portalMessage.createMany({
    data: [
      { customerId: custIds.martinez, senderType: "customer", content: "When will the pavers be finished? We're excited to use the patio!", createdAt: d(0) },
      { customerId: custIds.martinez, senderType: "company", content: "Hi Linda! Pavers should be fully set by Mar 14. We'll seal and clean up Mar 15. Looks great so far!", isRead: true, createdAt: d(0) },
      { customerId: custIds.sanders, senderType: "customer", content: "The enclosure is looking amazing! Can we add a pet door?", createdAt: d(-2) },
      { customerId: custIds.sanders, senderType: "company", content: "Thanks Tom! We can absolutely add a pet door. I'll get you a quote by tomorrow.", isRead: true, createdAt: d(-2) },
    ],
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

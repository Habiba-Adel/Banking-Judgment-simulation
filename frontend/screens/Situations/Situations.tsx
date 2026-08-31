"use client";

import { useState } from "react";
import { SituationsLayout } from "./Situations.layout";
import type { SituationsData, StatusFilter } from "./types";

const MOCK_DATA: SituationsData = {
  categories: [
    {
      id: "data-confidentiality-digital-conduct",
      title: "Data, Confidentiality & Digital Conduct",
      missions: [
        {
          id: "screenshot-shortcut",
          title: "The Screenshot Shortcut",
          description: "Customer service speed vs. confidentiality and approved channels.",
          status: "in_progress",
          thumbnailSrc: "/mission-photo-2.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
          currentStep: 3,
          playedLabel: "2 days ago",
        },
        {
          id: "vip-friend-request",
          title: "The VIP Friend Request",
          description: "Personal influence vs. confidentiality and authorized access.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-4.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "vendor-access-request",
          title: "The Vendor Access Request",
          description: "Fixing an issue fast vs protecting production and customer data from third-party access.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-1.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "gift-hospitality-dilemma",
          title: "The Gift & Hospitality Dilemma",
          description: "Maintaining relationships vs avoiding conflicts of interest and perceived influence.",
          status: "completed",
          thumbnailSrc: "/mission-photo-3.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: "regulatory-compliance-risk-controls",
      title: "Regulatory Compliance & Risk Controls",
      missions: [
        {
          id: "suspicious-pattern",
          title: "The Suspicious Pattern",
          description: "The amounts are small, but the pattern may indicate unusual activity.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-2.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "kyc-almost-complete",
          title: "KYC Almost Complete",
          description: "Speed of onboarding vs completing required KYC/CDD verification.",
          status: "completed",
          thumbnailSrc: "/mission-photo-4.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: "customer-trust-fair-treatment",
      title: "Customer Trust & Fair Treatment",
      missions: [
        {
          id: "angry-customer-complaint",
          title: "The Angry Customer Complaint",
          description: "Bank reputation vs. formal complaint handling and customer confidentiality.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-1.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "sales-target-trap",
          title: "The Sales Target Trap",
          description: "Meeting sales targets vs recommending suitable products with clear disclosure.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-3.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "inclusive-digital-banking",
          title: "Inclusive Digital Banking",
          description: "Launch speed vs accessibility for elderly, disabled, and less digitally-literate customers.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-2.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
      ],
    },
    {
      id: "responsible-banking-sustainability",
      title: "Responsible Banking & Sustainability",
      missions: [
        {
          id: "green-or-greenwashing",
          title: "Green or Greenwashing?",
          description: "Supporting business growth while verifying sustainability claims and avoiding misleading classifications.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-4.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "paperless-bank-paradox",
          title: "The Paperless Bank Paradox",
          description: "Convenient habits vs the bank's digital/paperless and data-minimisation commitments.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-1.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
        {
          id: "supplier-choice",
          title: "The Supplier Choice",
          description: "Lowest cost vs data protection, compliance, and ESG/third-party risk.",
          status: "not_started",
          thumbnailSrc: "/mission-photo-3.jpg",
          totalDecisions: 5,
          estimatedMinutes: 10,
        },
      ],
    },
  ],
};

export function Situations() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const categories =
    statusFilter === "all"
      ? MOCK_DATA.categories
      : MOCK_DATA.categories
          .map((category) => ({
            ...category,
            missions: category.missions.filter((mission) => mission.status === statusFilter),
          }))
          .filter((category) => category.missions.length > 0);

  return (
    <SituationsLayout
      categories={categories}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
    />
  );
}

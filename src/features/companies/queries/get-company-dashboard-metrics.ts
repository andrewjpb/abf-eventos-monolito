"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { CompanyDashboardMetrics } from "../types"

// Combined query for company dashboard metrics
export const getCompanyDashboardMetrics = cache(async (): Promise<CompanyDashboardMetrics> => {
  // Get company status metrics (active/inactive)
  const companyStats = await getCompanyStatusMetrics()

  // Get company segment distribution
  const segmentDistribution = await getSegmentDistribution()

  return {
    companyStats,
    segmentDistribution
  }
})

// Query to get counts of active and inactive companies
const getCompanyStatusMetrics = cache(async () => {
  const activeCompanies = await prisma.company.count({
    where: {
      active: true
    }
  })

  const inactiveCompanies = await prisma.company.count({
    where: {
      active: false
    }
  })

  return {
    active: activeCompanies,
    inactive: inactiveCompanies,
    total: activeCompanies + inactiveCompanies
  }
})

// Query to get distribution of companies by segment
const getSegmentDistribution = cache(async () => {
  const segments = await prisma.company.groupBy({
    by: ['segment'],
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    }
  })

  return segments.map(segment => ({
    segment: segment.segment,
    count: segment._count.id
  }))
})
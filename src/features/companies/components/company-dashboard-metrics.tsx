"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCompanyDashboardMetrics } from "../queries/get-company-dashboard-metrics"
import { LucideLoaderCircle, Building2, CheckCircle, XCircle, Tag } from "lucide-react"

export function CompanyDashboardMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ["companyDashboardMetrics"],
    queryFn: () => getCompanyDashboardMetrics(),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LucideLoaderCircle className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const { companyStats, segmentDistribution } = data || {
    companyStats: { active: 0, inactive: 0, total: 0 },
    segmentDistribution: []
  }

  // Get top 3 segments with most companies
  const topSegments = [...(segmentDistribution || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Company status metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-2 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {companyStats?.total || 0}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Associadas</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              {companyStats?.active || 0}
            </Badge>
          </CardContent>
        </Card>

        <Card className="p-2 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
          <CardContent className="p-2 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Não Associadas</p>
            </div>
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              {companyStats?.inactive || 0}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Top segments */}
      {topSegments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topSegments.map(segment => (
            <Card key={segment.segment} className="p-2 border-slate-200 dark:border-slate-800">
              <CardContent className="p-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium flex items-center">
                    <Tag className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                    {segment.segment}
                  </h3>
                  <Badge variant="outline">{segment.count} empresa{segment.count !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (segment.count / (companyStats?.total || 1)) * 100)}%`
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
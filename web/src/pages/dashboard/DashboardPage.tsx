import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  IndianRupee,
  LayoutDashboard,
  Package,
  PiggyBank,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMe } from "@/features/auth/hooks";
import { useDashboardSummary } from "@/features/dashboard/hooks";
import { useExpenseSummary } from "@/features/expenses/hooks";
import { usePurchaseSummary } from "@/features/purchases/hooks";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPeriodRange, type Period } from "@/lib/period";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { AnimatedNumber } from "@/components/common/AnimatedNumber";
import { Sparkline } from "@/components/common/Sparkline";
import { MiniBarList } from "@/components/common/MiniBarList";
import { Timeline, TimelineItem } from "@/components/common/Timeline";
import { StaggerList, StaggerItem } from "@/components/motion/Stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const quickActions = [
  { label: "New product", to: "/products/new", icon: Package },
  { label: "New order", to: "/orders", icon: ShoppingCart },
  { label: "New purchase", to: "/purchases", icon: Receipt },
  { label: "New expense", to: "/expenses", icon: Wallet },
];

function formatDayLabel(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function DashboardPage() {
  const { data } = useMe();
  const [period, setPeriod] = useState<Period>("month");

  const { from, to } = useMemo(() => getPeriodRange(period), [period]);

  const summary = useDashboardSummary({ from, to });
  const expenseSummary = useExpenseSummary({ from, to });
  const purchaseSummary = usePurchaseSummary({ from, to });

  const activity = summary.data?.recentActivity ?? [];
  const bottomLine = summary.data?.bottomLine ?? 0;
  const isLoading = summary.isLoading;

  const expensePoints = (expenseSummary.data?.byDay ?? []).map((d) => ({
    label: formatDayLabel(d.date),
    value: d.totalAmount,
  }));
  const purchasePoints = (purchaseSummary.data?.byDay ?? []).map((d) => ({
    label: formatDayLabel(d.date),
    value: d.totalAmount,
  }));
  const materialBars = (purchaseSummary.data?.byMaterial ?? []).map((m) => ({
    label: m.name,
    value: Number(m.totalAmount),
  }));

  return (
    <div>
      <PageHeader
        title={`Welcome, ${data?.user.name ?? ""}`}
        description="Your business overview."
        action={
          <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <TabsList>
              <TabsTrigger value="all">All time</TabsTrigger>
              <TabsTrigger value="month">This month</TabsTrigger>
              <TabsTrigger value="year">This year</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button key={action.label} variant="outline" size="sm" asChild>
            <Link to={action.to}>
              <action.icon className="size-4" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Revenue"
              value={<AnimatedNumber value={summary.data?.revenue ?? 0} format={formatCurrency} />}
              icon={IndianRupee}
              accent="primary"
            />
            <StatCard
              label="Order profit"
              value={<AnimatedNumber value={summary.data?.orderProfit ?? 0} format={formatCurrency} />}
              icon={TrendingUp}
              accent="success"
              valueClassName="text-success"
            />
            <StatCard
              label="Expenses"
              value={<AnimatedNumber value={summary.data?.expenses ?? 0} format={formatCurrency} />}
              icon={Wallet}
              accent="warning"
              valueClassName="text-warning"
            />
            <StatCard
              label="Bottom line"
              value={<AnimatedNumber value={bottomLine} format={formatCurrency} />}
              icon={PiggyBank}
              accent={bottomLine >= 0 ? "success" : "destructive"}
              valueClassName={bottomLine >= 0 ? "text-success" : "text-destructive"}
            />
          </>
        )}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Expenses trend</CardTitle>
            <span className="text-xs text-muted-foreground">By day</span>
          </CardHeader>
          <CardContent>
            {expenseSummary.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <Sparkline data={expensePoints} color="var(--warning)" formatValue={formatCurrency} height={72} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Purchases trend</CardTitle>
            <span className="text-xs text-muted-foreground">By day</span>
          </CardHeader>
          <CardContent>
            {purchaseSummary.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <Sparkline data={purchasePoints} color="var(--secondary)" formatValue={formatCurrency} height={72} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Raw material investment
              </p>
              {isLoading ? (
                <Skeleton className="mt-1.5 h-7 w-24" />
              ) : (
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatCurrency(summary.data?.rawMaterialInvestment ?? 0)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Reference only — already reflected in order profit above
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Package className="size-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Low stock items
              </p>
              {isLoading ? (
                <Skeleton className="mt-1.5 h-7 w-10" />
              ) : (
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {summary.data?.lowStockCount ?? 0}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Check the Inventory page for details</p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/15">
              <AlertTriangle className="size-4 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchases by material</CardTitle>
          </CardHeader>
          <CardContent>
            {purchaseSummary.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <MiniBarList items={materialBars} color="var(--secondary)" formatValue={formatCurrency} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="Nothing here yet"
              description="Orders, stock changes, and expenses will show up here."
            />
          ) : (
            <StaggerList>
              <Timeline>
                {activity.map((item, index) => {
                  const isStockOut = item.type === "STOCK_MOVEMENT" && (item.amount ?? 0) < 0;
                  const chipAccent = isStockOut
                    ? "bg-muted text-muted-foreground"
                    : item.type === "EXPENSE"
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success";
                  const Icon =
                    item.type === "ORDER"
                      ? ShoppingCart
                      : item.type === "EXPENSE"
                        ? Wallet
                        : isStockOut
                          ? ArrowDownCircle
                          : ArrowUpCircle;

                  const meta = (
                    <div className="shrink-0 text-right">
                      {item.amount !== null && item.type !== "STOCK_MOVEMENT" && (
                        <p
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            item.amount < 0 && "text-destructive",
                          )}
                        >
                          {item.amount < 0 ? "-" : ""}
                          {formatCurrency(Math.abs(item.amount))}
                        </p>
                      )}
                      {item.type === "STOCK_MOVEMENT" && item.amount !== null && (
                        <p
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            isStockOut ? "text-muted-foreground" : "text-success",
                          )}
                        >
                          {item.amount >= 0 ? "+" : ""}
                          {item.amount}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.occurredAt).toLocaleString()}
                      </p>
                    </div>
                  );

                  return (
                    <StaggerItem key={item.id}>
                      <TimelineItem
                        icon={<Icon className="size-4" />}
                        iconClassName={chipAccent}
                        title={item.title}
                        detail={item.detail}
                        meta={meta}
                        isLast={index === activity.length - 1}
                      />
                    </StaggerItem>
                  );
                })}
              </Timeline>
            </StaggerList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

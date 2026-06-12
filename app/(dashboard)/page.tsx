import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  DollarSign,
  Package,
  DatabaseZap,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ETIQUETAS_CARTON, TipoCartonType } from "@/lib/config";
import { cn } from "@/lib/utils";

// ───── Trend indicator helper ─────
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Minus className="h-3 w-3" />
        Nuevo
      </span>
    );
  }

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const up = pct >= 0;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs mt-1",
        up ? "text-emerald-500" : "text-red-500"
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {pct.toFixed(1)}% vs mes anterior
    </span>
  );
}

export default async function DashboardPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // ───── Date ranges for current & previous month ─────
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfPrevMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  // ───── State ─────
  let ingresosMes = 0;
  let gastosMes = 0;
  let cartonesEntregados = 0;
  let clientesConDeuda = 0;
  let clientesConDeudaVencida = 0;
  let deudaTotal = 0;
  let dbConnected = true;
  let desgloseCartones: { tipo: TipoCartonType; cantidad: number }[] = [];

  let ingresosPrev = 0;
  let gastosPrev = 0;
  let cartonesPrev = 0;

  let topDeudores: { id: string; nombre: string; deuda: number }[] = [];
  let topDeudasViejas: { id: string; nombre: string; deuda: number; diasSinMovimiento: number }[] = [];

  try {
    // ── Current-month aggregates ──
    const [pagos, gastos, entregas] = await Promise.all([
      prisma.movimiento.aggregate({
        where: { tipo: "PAGO", fecha: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { monto: true },
      }),
      prisma.gasto.aggregate({
        where: { fecha: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { monto: true },
      }),
      prisma.movimiento.aggregate({
        where: { tipo: "ENTREGA", fecha: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { cartones: true },
      }),
    ]);
    ingresosMes = pagos._sum.monto || 0;
    gastosMes = gastos._sum.monto || 0;
    cartonesEntregados = entregas._sum.cartones || 0;

    // ── Previous-month aggregates ──
    const [pagosPrev, gastosPrevQ, entregasPrev] = await Promise.all([
      prisma.movimiento.aggregate({
        where: { tipo: "PAGO", fecha: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        _sum: { monto: true },
      }),
      prisma.gasto.aggregate({
        where: { fecha: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        _sum: { monto: true },
      }),
      prisma.movimiento.aggregate({
        where: { tipo: "ENTREGA", fecha: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
        _sum: { cartones: true },
      }),
    ]);
    ingresosPrev = pagosPrev._sum.monto || 0;
    gastosPrev = gastosPrevQ._sum.monto || 0;
    cartonesPrev = entregasPrev._sum.cartones || 0;

    // ── Desglose cartones ──
    const desglose = await prisma.movimiento.groupBy({
      by: ["tipoCarton"],
      where: {
        tipo: "ENTREGA",
        fecha: { gte: startOfMonth, lte: endOfMonth },
        tipoCarton: { not: null },
      },
      _sum: { cartones: true },
    });
    desgloseCartones = desglose
      .map((d) => ({
        tipo: d.tipoCarton as TipoCartonType,
        cantidad: d._sum.cartones || 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // ── Clients: debt + top debtors ──
    const allClients = await prisma.cliente.findMany({
      include: { movimientos: true },
    });

    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deudoresMap: { id: string; nombre: string; deuda: number }[] = [];
    const deudasViejasMap: { id: string; nombre: string; deuda: number; diasSinMovimiento: number }[] = [];

    allClients.forEach((cliente) => {
      let saldo = 0;
      let ultimaEntrega = new Date(0);
      let lastMovimientoTime = 0;

      cliente.movimientos.forEach((m) => {
        if (m.fecha.getTime() > lastMovimientoTime) lastMovimientoTime = m.fecha.getTime();
        if (m.tipo === "ENTREGA") {
          saldo += (m.cartones || 0) * (m.precioUnit || 0);
          if (m.fecha > ultimaEntrega) ultimaEntrega = m.fecha;
        } else if (m.tipo === "PAGO") {
          saldo -= m.monto || 0;
        }
      });

      if (saldo > 0) {
        clientesConDeuda++;
        deudaTotal += saldo;
        deudoresMap.push({ id: cliente.id, nombre: cliente.nombre, deuda: saldo });
        
        let diasSinMovimiento = lastMovimientoTime > 0 ? Math.floor((currentDate.getTime() - lastMovimientoTime) / (1000 * 60 * 60 * 24)) : -1;
        deudasViejasMap.push({ id: cliente.id, nombre: cliente.nombre, deuda: saldo, diasSinMovimiento });

        if (ultimaEntrega < thirtyDaysAgo) {
          clientesConDeudaVencida++;
        }
      }
    });

    topDeudores = deudoresMap.sort((a, b) => b.deuda - a.deuda).slice(0, 5);
    topDeudasViejas = deudasViejasMap.sort((a, b) => b.diasSinMovimiento - a.diasSinMovimiento).slice(0, 5);

  } catch (error) {
    dbConnected = false;
    console.error("Database connection error:", error);
  }

  const saldoNeto = ingresosMes - gastosMes;
  const saldoPrev = ingresosPrev - gastosPrev;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resumen del Mes</h2>
          <p className="text-muted-foreground capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {/* ── DB error ── */}
      {!dbConnected && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6 flex items-center gap-4">
            <DatabaseZap className="h-8 w-8 text-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Base de datos no conectada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configura la variable{" "}
                <code className="bg-muted px-1 rounded">DATABASE_URL</code> en Vercel → Settings →
                Environment Variables con tu URL de Neon PostgreSQL. Luego haz Redeploy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Metric cards ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Ingresos */}
        <Link href="/clientes" className="block transition-transform hover:scale-[1.02]">
          <Card className="border-l-4 border-l-primary shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${ingresosMes.toLocaleString("es-CO")}
              </div>
              <TrendBadge current={ingresosMes} previous={ingresosPrev} />
            </CardContent>
          </Card>
        </Link>

        {/* Gastos */}
        <Link href="/gastos" className="block transition-transform hover:scale-[1.02]">
          <Card className="border-l-4 border-l-destructive shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos</CardTitle>
              <ArrowUpToLine className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${gastosMes.toLocaleString("es-CO")}
              </div>
              <TrendBadge current={gastosMes} previous={gastosPrev} />
            </CardContent>
          </Card>
        </Link>

        {/* Saldo Neto */}
        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                saldoNeto >= 0 ? "text-primary" : "text-destructive"
              )}
            >
              ${saldoNeto.toLocaleString("es-CO")}
            </div>
            <TrendBadge current={saldoNeto} previous={saldoPrev} />
          </CardContent>
        </Card>

        {/* Cartones Entregados */}
        <Link href="/produccion" className="block transition-transform hover:scale-[1.02]">
          <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cartones Entregados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartonesEntregados}</div>
              <TrendBadge current={cartonesEntregados} previous={cartonesPrev} />
            </CardContent>
          </Card>
        </Link>

        {/* Deuda Total */}
        <Link href="/clientes" className="block transition-transform hover:scale-[1.02]">
          <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Total en Calle</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ${deudaTotal.toLocaleString("es-CO")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                De {clientesConDeuda} clientes c/ deuda
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Deuda Vencida */}
        <Link href="/clientes" className="block transition-transform hover:scale-[1.02]">
          <Card
            className={cn(
              "shadow-sm cursor-pointer hover:shadow-md transition-shadow",
              clientesConDeudaVencida > 0 && "border-destructive bg-destructive/5"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deuda Vencida (+30 días)</CardTitle>
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  clientesConDeudaVencida > 0 ? "text-destructive" : "text-muted-foreground"
                )}
              />
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  clientesConDeudaVencida > 0 ? "text-destructive" : ""
                )}
              >
                {clientesConDeudaVencida}
              </div>
              {clientesConDeudaVencida > 0 && (
                <p className="text-xs text-destructive mt-1">Requiere atención</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Second row: Desglose + Top Deudores ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Desglose Cartones */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              Desglose de Cartones (Este Mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {desgloseCartones.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay entregas registradas este mes.
              </p>
            ) : (
              <div className="space-y-4">
                {desgloseCartones.map((item) => (
                  <div key={item.tipo} className="flex items-center justify-between">
                    <span className="font-medium text-sm">{ETIQUETAS_CARTON[item.tipo]}</span>
                    <span className="font-bold">{item.cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Clientes con Mayor Deuda */}
        <Card className="shadow-sm flex flex-col">
          <Link href="/clientes?filter=top-deuda" className="hover:opacity-80 transition-opacity">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Top 5 Mayor Deuda
                <span className="ml-auto text-xs font-normal text-muted-foreground underline">Ver filtro &rarr;</span>
              </CardTitle>
            </CardHeader>
          </Link>
          <CardContent className="flex-1">
            {topDeudores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay clientes con deuda.</p>
            ) : (
              <div className="space-y-3">
                {topDeudores.map((client, i) => (
                  <Link
                    key={client.id}
                    href={`/clientes/${client.id}`}
                    className="flex items-center justify-between group hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-medium group-hover:underline truncate max-w-[160px]">
                        {client.nombre}
                      </span>
                    </span>
                    <span className="text-sm font-bold text-red-500">
                      ${client.deuda.toLocaleString("es-CO")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Deudas Más Viejas */}
        <Card className="shadow-sm flex flex-col">
          <Link href="/clientes?filter=top-viejas" className="hover:opacity-80 transition-opacity">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Top 5 Deudas Viejas
                <span className="ml-auto text-xs font-normal text-muted-foreground underline">Ver filtro &rarr;</span>
              </CardTitle>
            </CardHeader>
          </Link>
          <CardContent className="flex-1">
            {topDeudasViejas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay clientes con deudas viejas.</p>
            ) : (
              <div className="space-y-3">
                {topDeudasViejas.map((client, i) => (
                  <Link
                    key={client.id}
                    href={`/clientes/${client.id}`}
                    className="flex items-center justify-between group hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <span className="flex flex-col">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-5">
                          {i + 1}.
                        </span>
                        <span className="text-sm font-medium group-hover:underline truncate max-w-[140px]">
                          {client.nombre}
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-7">
                        Hace {client.diasSinMovimiento} días
                      </span>
                    </span>
                    <span className="text-sm font-bold text-destructive">
                      ${client.deuda.toLocaleString("es-CO")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, ArrowDownToLine, ArrowUpToLine, DollarSign, Package, DatabaseZap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  let ingresosMes = 0;
  let gastosMes = 0;
  let cartonesEntregados = 0;
  let clientesConDeuda = 0;
  let clientesConDeudaVencida = 0;
  let dbConnected = true;

  try {
    const pagos = await prisma.movimiento.aggregate({
      where: { tipo: "PAGO", fecha: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { monto: true }
    });
    ingresosMes = pagos._sum.monto || 0;

    const gastos = await prisma.gasto.aggregate({
      where: { fecha: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { monto: true }
    });
    gastosMes = gastos._sum.monto || 0;

    const entregas = await prisma.movimiento.aggregate({
      where: { tipo: "ENTREGA", fecha: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { cartones: true }
    });
    cartonesEntregados = entregas._sum.cartones || 0;

    const allClients = await prisma.cliente.findMany({
      include: { movimientos: true }
    });

    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    allClients.forEach(cliente => {
      let saldo = 0;
      let ultimaEntrega = new Date(0);

      cliente.movimientos.forEach(m => {
        if (m.tipo === "ENTREGA") {
          saldo += (m.cartones || 0) * (m.precioUnit || 0);
          if (m.fecha > ultimaEntrega) ultimaEntrega = m.fecha;
        } else if (m.tipo === "PAGO") {
          saldo -= (m.monto || 0);
        }
      });

      if (saldo > 0) {
        clientesConDeuda++;
        if (ultimaEntrega < thirtyDaysAgo) {
          clientesConDeudaVencida++;
        }
      }
    });
  } catch (error) {
    dbConnected = false;
    console.error("Database connection error:", error);
  }

  const saldoNeto = ingresosMes - gastosMes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resumen del Mes</h2>
          <p className="text-muted-foreground capitalize">
            {format(currentDate, "MMMM 'de' yyyy", { locale: es })}
          </p>
        </div>
      </div>

      {!dbConnected && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6 flex items-center gap-4">
            <DatabaseZap className="h-8 w-8 text-destructive flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Base de datos no conectada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configura la variable <code className="bg-muted px-1 rounded">DATABASE_URL</code> en 
                Vercel → Settings → Environment Variables con tu URL de Neon PostgreSQL.
                Luego haz Redeploy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${ingresosMes.toLocaleString("es-CO")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <ArrowUpToLine className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${gastosMes.toLocaleString("es-CO")}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", saldoNeto >= 0 ? "text-primary" : "text-destructive")}>
              ${saldoNeto.toLocaleString("es-CO")}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartones Entregados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartonesEntregados}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes c/ Deuda</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientesConDeuda}</div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm", clientesConDeudaVencida > 0 && "border-destructive bg-destructive/5")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Vencida (+30 días)</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", clientesConDeudaVencida > 0 ? "text-destructive" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", clientesConDeudaVencida > 0 ? "text-destructive" : "")}>
              {clientesConDeudaVencida}
            </div>
            {clientesConDeudaVencida > 0 && (
              <p className="text-xs text-destructive mt-1">Requiere atención</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

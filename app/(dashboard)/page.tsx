import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, ArrowDownToLine, ArrowUpToLine, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function DashboardPage() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  // 1. Ingresos del mes (PAGOS)
  const pagos = await prisma.movimiento.aggregate({
    where: {
      tipo: "PAGO",
      fecha: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { monto: true }
  });
  const ingresosMes = pagos._sum.monto || 0;

  // 2. Gastos del mes
  const gastos = await prisma.gasto.aggregate({
    where: {
      fecha: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { monto: true }
  });
  const gastosMes = gastos._sum.monto || 0;

  // 3. Saldo neto
  const saldoNeto = ingresosMes - gastosMes;

  // 4. Cartones entregados este mes
  const entregas = await prisma.movimiento.aggregate({
    where: {
      tipo: "ENTREGA",
      fecha: { gte: startOfMonth, lte: endOfMonth }
    },
    _sum: { cartones: true }
  });
  const cartonesEntregados = entregas._sum.cartones || 0;

  // Clientes con deuda activa (vamos a calcular el saldo de cada cliente)
  const allClients = await prisma.cliente.findMany({
    include: { movimientos: true }
  });

  let clientesConDeuda = 0;
  let clientesConDeudaVencida = 0;
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      
      {/* TODO: Add simple chart for 6 months history */}
    </div>
  );
}

// utility function included in same file for brevity
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

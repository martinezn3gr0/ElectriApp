export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Privacidad</h1>
        <p className="text-white/60 leading-relaxed">
          ElectriApp utiliza tus datos de cuenta (nombre, correo y foto de perfil de Google o Facebook) únicamente para
          autenticarte, mostrar tu perfil a otros usuarios de la plataforma y facilitar la conexión entre clientes y
          electricistas.
        </p>
        <p className="text-white/60 leading-relaxed">
          Los mensajes y reseñas se almacenan en Firestore asociados a tu proyecto. No vendemos tu información personal a
          terceros. Puedes solicitar la eliminación de tu cuenta contactando a soporte.
        </p>
      </div>
    </div>
  );
}

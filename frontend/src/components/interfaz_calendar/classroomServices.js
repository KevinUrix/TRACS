import { 
  Snowflake, Projector, Tv, Volume2, Fan, Wifi, 
  Laptop, Presentation, Plug, Accessibility 
} from 'lucide-react';

const getServiceIcon = (serviceName, props = {}) => {
  const service = serviceName.toLowerCase();
  
  if (service.includes('aire')) return <Snowflake {...props} />;
  if (service.includes('proyector')) return <Projector {...props} />;
  if (service.includes('pantalla')) return <Tv {...props} />;
  if (service.includes('audio')) return <Volume2 {...props} />;
  if (service.includes('ventilador')) return <Fan {...props} />;
  if (service.includes('red')) return <Wifi {...props} />;
  if (service.includes('computadora')) return <Laptop {...props} />;
  if (service.includes('pintarron')) return <Presentation {...props} />;
  if (service.includes('enchufe')) return <Plug {...props} />;
  
  return null;
};

const getServiceWeight = (serviceName) => {
  const service = serviceName.toLowerCase();
  
  if (service.includes('aire')) return 1;
  if (service.includes('ventilador')) return 2;
  if (service.includes('pantalla')) return 3;
  if (service.includes('red')) return 4;
  if (service.includes('computadora')) return 5;
  if (service.includes('audio')) return 6;
  
  return 99;
};

export default function ClassroomServices({ services, isAccessible }) {
  if ((!services || services.length === 0) && !isAccessible) return null;

  const sortedServices = services 
    ? [...services].sort((a, b) => getServiceWeight(a) - getServiceWeight(b)) 
    : [];

  const visibleServices = sortedServices.slice(0, 5);
  const hasMore = sortedServices.length > 5;

  return (
    <div className="flex flex-wrap justify-center items-center gap-1.5 my-1 cursor-help text-gray-700">
      {isAccessible && (
        <span title="Aula Accesible" className="text-blue-600 drop-shadow-sm">
          <Accessibility className="w-[25px] h-[25px]" />
        </span>
      )}
      
      {visibleServices.map((srv, idx) => {
        const formattedSrv = srv.charAt(0).toUpperCase() + srv.slice(1);

        return (
          <span key={idx} title={formattedSrv} className="flex items-center">
            {getServiceIcon(srv, { className: "w-[25px] h-[25px]" })}
          </span>
        );
      })}

      {hasMore && (
        <span className="font-extrabold text-[20px] text-gray-600 tracking-widest translate-y-1.2">
          ...
        </span>
      )}
    </div>
  );
}
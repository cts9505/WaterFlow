import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';

// Fix leaflet default icons missing in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Tanker Icon
const tankerIcon = new L.DivIcon({
  html: '<div style="font-size: 24px; padding: 4px; background: white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: inline-block;">🚚</div>',
  className: 'custom-tanker-wrapper',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Component to dynamically pan the map
function MapUpdater({ center }: { center: {lat: number, lng: number} }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14);
  }, [center, map]);
  return null;
}

export default function Customer() {
  const [userLocation, setUserLocation] = useState({ lat: 19.0760, lng: 72.8777 }); // Default Mumbai
  const [tankers, setTankers] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [liveTanker, setLiveTanker] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Attempt Geolocation pinpointing
    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
       }, () => console.log('Geolocation denied, using default.'));
    }
  }, []);

  useEffect(() => {
     // Fetch all nearby tankers immediately when location loads
     api.get(`/tankers/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`)
       .then(res => setTankers(res.data.tankers))
       .catch(console.error);
  }, [userLocation]);

  const handleBooking = async () => {
    const fakeBookingId = `INV-${Math.floor(Math.random() * 10000)}`;
    setBookingId(fakeBookingId);
    
    // Subscribe to SSE
    const eventSource = new EventSource(`http://localhost:5005/api/tracking/${fakeBookingId}`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveTanker({ lat: data.lat, lng: data.lng });
    };
  };

  return (
    <div style={{ position: 'relative', height: 'calc(100vh - 84px)' }}>
      {/* Map Layer */}
      <MapContainer 
         center={[userLocation.lat, userLocation.lng]} 
         zoom={14} 
         style={{ height: '100%', width: '100%', zIndex: 0 }}
         zoomControl={false}
      >
        {/* CARTO Voyager gives a very premium, modern, aesthetic map style compared to standard OpenStreetMap */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={userLocation} />

        {/* User Marker */}
        <Marker position={[userLocation.lat, userLocation.lng]}>
          <Popup>Delivery Dropoff Location</Popup>
        </Marker>

        {/* Nearby Generic Tankers */}
        {!liveTanker && tankers.map(t => (
           <Marker key={t.id} position={[t.lat, t.lng]} icon={tankerIcon}>
             <Popup>
               <strong>{t.capacity} Tanker</strong><br/>
               <span style={{ color: t.status === 'AVAILABLE' ? 'green' : 'red' }}>{t.status}</span>
             </Popup>
           </Marker>
        ))}

        {/* Live Active Delivery Tanker updating via SSE! */}
        {liveTanker && (
           <Marker position={[liveTanker.lat, liveTanker.lng]} icon={tankerIcon}>
             <Popup>Your Assigned Tanker!</Popup>
           </Marker>
        )}
      </MapContainer>

      {/* Floating Bottom Card UI */}
      <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', zIndex: 1000 }}>
         <div className="glass-card" style={{ padding: '20px' }}>
            {!bookingId ? (
              <>
                <h3 style={{ margin: '0 0 5px 0', color: 'var(--primary-blue)', fontSize: '1.2rem' }}>Ready for delivery?</h3>
                <p style={{ margin: '0 0 15px 0', color: 'var(--text-light)', fontSize: '0.9rem' }}>{tankers.length} tankers available near you.</p>
                
                <input 
                  type="text" 
                  placeholder="Search delivery location..." 
                  defaultValue="Current Location"
                  style={{ width: '100%', padding: '14px', border: '1px solid #E5E7EB', borderRadius: '8px', marginBottom: '15px', boxSizing: 'border-box', background: '#F9FAFB', fontWeight: 500 }} 
                />
                <button className="btn-primary" onClick={handleBooking} style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                  Book Nearest Tanker
                </button>
              </>
            ) : (
               <>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{margin: 0, color: 'var(--text-dark)'}}>Booking: {bookingId}</h3>
                    <span style={{background: '#EBF1FF', color: 'var(--primary-blue)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600}}>
                       {liveTanker ? "IN TRANSIT" : "ASSIGNING..."}
                    </span>
                 </div>
                 <p style={{ margin: '0 0', color: '#4B5563', fontSize: '0.95rem' }}>
                    {liveTanker 
                      ? "Your tanker is en route! Watch the map for live updates via Captain signal." 
                      : "We are locating the best captain for you. Open the Captain Portal in another tab to assign it!"}
                 </p>
               </>
            )}
         </div>
      </div>
    </div>
  );
}

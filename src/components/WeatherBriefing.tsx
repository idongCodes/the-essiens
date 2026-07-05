"use client";

import { useState, useEffect } from "react";
import { 
  CloudIcon, 
  MapPinIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

interface WeatherData {
  current: {
    temperature_2m: number;
    precipitation: number;
  };
  current_units: {
    temperature_2m: string;
    precipitation: string;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
  };
}

export default function WeatherBriefing() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("Your Location");

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const fetchWeather = async (position: GeolocationPosition) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding for location name
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county;
            if (city) setLocationName(city);
          }
        } catch (e) {
          // Ignore reverse geocoding errors
        }

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation&daily=sunrise,sunset&timezone=auto`);
        
        if (!res.ok) throw new Error("Failed to fetch weather data");
        const data = await res.json();
        setWeather(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleLocationError = (err: GeolocationPositionError) => {
      setError(err.message);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(fetchWeather, handleLocationError);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-4 shadow-sm mb-8 flex flex-col items-center justify-center h-28 border border-slate-100 transition-all duration-300">
        <ArrowPathIcon className="w-5 h-5 animate-spin text-brand-sky mb-2" />
        <span className="text-sm font-medium text-slate-500">Checking local conditions...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-slate-50 rounded-3xl p-4 mb-8 text-sm text-slate-500 border border-slate-200 flex items-center justify-center transition-all duration-300">
        <MapPinIcon className="w-4 h-4 mr-2" />
        Allow location access to view your daily briefing.
      </div>
    );
  }

  const currentTemp = Math.round(weather.current.temperature_2m);
  const tempUnit = weather.current_units.temperature_2m;
  const precipitation = weather.current.precipitation;
  const precipUnit = weather.current_units.precipitation;
  const sunrise = new Date(weather.daily.sunrise[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sunset = new Date(weather.daily.sunset[0]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 rounded-3xl p-5 mb-8 shadow-lg text-white transition-all duration-500 hover:shadow-xl group">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700"></div>

      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
            <MapPinIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">Daily Briefing</h3>
            <p className="text-xs text-indigo-50 opacity-90">{locationName}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm border border-white/10">
          Live
        </span>
      </div>
      
      <div className="relative z-10 grid grid-cols-3 gap-3">
        {/* Temperature */}
        <div className="flex flex-col items-center justify-center bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/20 transition-colors">
          <SunIcon className="w-7 h-7 mb-1.5 text-yellow-300 drop-shadow-sm" />
          <div className="flex items-start">
            <span className="text-2xl font-bold tracking-tight">{currentTemp}</span>
            <span className="text-sm font-medium mt-0.5">{tempUnit}</span>
          </div>
          <span className="text-[10px] text-indigo-50 uppercase tracking-wider mt-1 font-medium">Temp</span>
        </div>

        {/* Precipitation */}
        <div className="flex flex-col items-center justify-center bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/20 transition-colors">
          <CloudIcon className="w-7 h-7 mb-1.5 text-blue-100 drop-shadow-sm" />
          <div className="flex items-start">
            <span className="text-xl font-bold tracking-tight">{precipitation}</span>
            <span className="text-xs font-medium mt-1 ml-0.5">{precipUnit}</span>
          </div>
          <span className="text-[10px] text-indigo-50 uppercase tracking-wider mt-1 font-medium">Precip</span>
        </div>

        {/* Sun Cycle */}
        <div className="flex flex-col items-center justify-center bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10 shadow-sm hover:bg-white/20 transition-colors">
          <div className="flex space-x-3 mb-2">
            <div className="flex flex-col items-center">
              <SunIcon className="w-4 h-4 text-orange-300 mb-0.5" />
              <span className="text-[10px] font-bold">{sunrise}</span>
            </div>
            <div className="flex flex-col items-center">
              <MoonIcon className="w-4 h-4 text-indigo-200 mb-0.5" />
              <span className="text-[10px] font-bold">{sunset}</span>
            </div>
          </div>
          <span className="text-[10px] text-indigo-50 uppercase tracking-wider font-medium whitespace-nowrap">Sun Cycle</span>
        </div>
      </div>
    </div>
  );
}

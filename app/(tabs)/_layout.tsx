import React, { useState, useEffect, useRef } from 'react';
import { View, Button, Text, StyleSheet, Dimensions } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const { width, height } = Dimensions.get('window');

const Tracker = () => {
  const [positions, setPositions]: any = useState([]);
  const [distance, setDistance]: any = useState(0);
  const [startTime, setStartTime]: any = useState(null);
  const [isRunning, setIsRunning]: any = useState(false);
  const [isPaused, setIsPaused]: any = useState(false);
  const [timer, setTimer]: any = useState(0);
  const watchID: any = useRef(null);

  // Atualiza o tempo do timer a cada segundo
  useEffect(() => {
    let interval = null;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimer((prev: any) => prev + 1);
      }, 1000);
    } else if (isPaused || !isRunning) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // Atualiza a posição do rastreamento
  useEffect(() => {
    if (isRunning) {
      watchID.current = Geolocation.watchPosition(
        (position) => {
          const newPosition = [position.coords.latitude, position.coords.longitude];
          setPositions((prevPositions: any) => {
            const updatedPositions = [...prevPositions, newPosition];
            if (updatedPositions.length > 1) {
              const lastPosition = updatedPositions[updatedPositions.length - 2];
              const distanceDelta = calculateDistance(lastPosition, newPosition);
              setDistance((prevDistance: any) => prevDistance + distanceDelta);
            }
            return updatedPositions;
          });
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, distanceFilter: 10, interval: 5000 }
      );
    } else {
      if (watchID.current) {
        Geolocation.clearWatch(watchID.current);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const calculateDistance = (lastCoords: any, currentCoords: any) => {
    const [lat1, lon1] = lastCoords;
    const [lat2, lon2] = currentCoords;

    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setStartTime(new Date());
    setPositions([]);
    setDistance(0);
    setTimer(0);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);

    if (watchID.current) {
      Geolocation.clearWatch(watchID.current);
    }
  };

  const getPace = () => {
    if (!startTime || distance === 0) return 0;
    const totalTimeInMinutes: any = (timer / 60).toFixed(2);
    return (totalTimeInMinutes / (distance / 1000)).toFixed(2);
  };

  const formatTime = (seconds: any) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Tempo: {formatTime(timer)}</Text>
        <Text style={styles.infoText}>Distância: {distance.toFixed(2)} metros</Text>
        <Text style={styles.infoText}>Pace: {getPace()} min/km</Text>
      </View>
      <View style={styles.buttonContainer}>
        {!isRunning && <Button title="Começar" onPress={handleStart} />}
        {isRunning && !isPaused && <Button title="Pausar" onPress={handlePause} />}
        {isRunning && isPaused && <Button title="Retomar" onPress={handleResume} />}
        {isRunning && <Button title="Finalizar" onPress={handleStop} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    marginVertical: 20,
  },
  infoText: {
    fontSize: 18,
    marginVertical: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default Tracker;

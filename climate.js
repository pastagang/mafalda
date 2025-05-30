import { getNudelDay } from './src/timedEvents/time.js';

// Climate is what determines the weather you get
// any change to it should be called "manmade climate change" (unless you're not human)
export const CLIMATE = {
  lwlsn: {
    name: 'lwlsn',
    when: () => true,
  },
};

export function getWeather(now = Date.now()) {
  // get the weather based on climate
  const params = new URLSearchParams(window.location.search);
  const isSong = params.has('song');
  const weather = {};
  for (const [key, rule] of Object.entries(CLIMATE)) {
    weather[key] = rule.when(now) && !isSong;
  }
  return weather;
}

window.getWeather = getWeather;

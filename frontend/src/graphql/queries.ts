export const SEARCH_LOCATIONS = `query Search($q:String!){
  searchLocations(query:$q){ name country latitude longitude timezone }
}`;

export const GET_RANKED_ACTIVITIES = `query Rank($lat:Latitude!,$lng:Longitude!){
  getRankedActivities(location:{latitude:$lat,longitude:$lng}){
    period{ start end }
    location{ latitude longitude }
    activities{ activity overallScore daily{ date score reasons } }
  }
}`;

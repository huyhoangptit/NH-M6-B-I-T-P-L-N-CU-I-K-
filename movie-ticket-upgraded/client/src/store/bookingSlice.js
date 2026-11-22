import { createSlice } from '@reduxjs/toolkit';

const bookingSlice = createSlice({
  name: 'booking',
  initialState: { selectedSeats: [], showtimeId: null },
  reducers: {
    setShowtime(state, action) { state.showtimeId = action.payload; state.selectedSeats = []; },
    toggleSeat(state, action) {
      const seat = action.payload;
      const exists = state.selectedSeats.some((item) => item.code === seat.code);
      if (exists) state.selectedSeats = state.selectedSeats.filter((item) => item.code !== seat.code);
      else if (state.selectedSeats.length < 8) state.selectedSeats.push(seat);
    },
    clearBooking(state) { state.selectedSeats = []; state.showtimeId = null; }
  }
});
export const { setShowtime, toggleSeat, clearBooking } = bookingSlice.actions;
export default bookingSlice.reducer;

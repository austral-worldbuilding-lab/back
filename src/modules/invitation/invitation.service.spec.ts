describe('Invitation Token and Expiration', () => {
  describe('Expiration date calculation', () => {
    it('should set expiration date to current date + 7 days (604800 seconds)', () => {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 604800);

      const timeDifference = expiresAt.getTime() - now.getTime();
      const expectedTimeDifference = 604800 * 1000; // 7 days in milliseconds

      // Allow for a small tolerance due to execution time (1 second)
      expect(Math.abs(timeDifference - expectedTimeDifference)).toBeLessThan(
        1000,
      );
    });
  });
});

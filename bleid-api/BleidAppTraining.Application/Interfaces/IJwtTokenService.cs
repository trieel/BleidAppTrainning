using System.Security.Claims;
using BleidAppTraining.Domain.Entities;

namespace BleidAppTraining.Application.Interfaces;

public interface IJwtTokenService
{
    string CreateToken(User user, IEnumerable<string> roles);
    ClaimsPrincipal? GetPrincipalFromToken(string token, bool allowGracePeriod = true);
}

using BleidAppTraining.Domain.Entities;

namespace BleidAppTraining.Application.Interfaces;

public interface IJwtTokenService
{
    string CreateToken(User user, IEnumerable<string> roles);
}

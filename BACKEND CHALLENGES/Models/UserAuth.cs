using System;
using System.Collections.Generic;

namespace BACKEND_CHALLENGES.Models;

public partial class UserAuth
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string PasswordHash { get; set; } = null!;

    public DateTime? LastLogin { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}

using System;
using System.Collections.Generic;

namespace BACKEND_CHALLENGES.Models;

public partial class Enrollment
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int CourseId { get; set; }

    public DateTime? EnrolledAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual Course Course { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

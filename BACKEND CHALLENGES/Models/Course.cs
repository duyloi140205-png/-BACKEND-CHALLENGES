using System;
using System.Collections.Generic;

namespace BACKEND_CHALLENGES.Models;

public partial class Course
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string? ThumbnailUrl { get; set; }

    public int InstructorId { get; set; }

    public decimal? Price { get; set; }

    public bool? IsPublished { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Class> Classes { get; set; } = new List<Class>();

    public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    public virtual User Instructor { get; set; } = null!;
}

// components/sections/ProjectsSection.tsx
import { ExternalLink, Github } from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  technologies: string[]
  imageUrl: string
  liveUrl?: string
  githubUrl?: string
}

export function ProjectsSection() {
  const projects: Project[] = [
    {
      id: 'wordle-solver',
      title: 'Wordle Solver',
      description: 'An intelligent Wordle solver using entropy analysis and letter frequency optimization to suggest optimal guesses.',
      technologies: ['Python', 'Machine Learning', 'Information Theory'],
      imageUrl: '/assets/wordle-solver.jpg',
      githubUrl: 'https://github.com/choiboy92/my-wordle-solver',
      liveUrl: '/projects/wordle-solver'
    },
    // Add your other projects from your current portfolio
  ]

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            My Projects
          </h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A showcase of my recent work and experiments in web development and machine learning
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
              style={{
                animationDelay: `${index * 0.2}s`,
              }}
            >
              {/* Project Image */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/project-placeholder.jpg'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {project.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Project Links */}
                <div className="flex space-x-4">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Github size={18} />
                      <span className="text-sm">Code</span>
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <ExternalLink size={18} />
                      <span className="text-sm">Live Demo</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

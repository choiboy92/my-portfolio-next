'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false)

  const skills = [
    'Mechanical Engineering', 'Product Management', 'Machine Learning', 
    'Computer Vision', 'Web Development', 'CAD Design', 'Research'
  ]

  const achievements = [
    {
      institution: 'Imperial College London',
      items: [
        'First Class Honours (2019 & 2020 examinations)',
        'Dean\'s List award (2020)',
        'Squash Social Secretary 20/21',
        'ICKFC Vice-Captain 19/20'
      ]
    },
    {
      institution: 'Eton College',
      items: [
        'Keeper of Entrepreneurship Society',
        'House Captain & Academic Scholar',
        'A-levels (5 A*s)',
        'GCSEs (11 A*s)'
      ]
    }
  ]

  useEffect(() => {
    setIsVisible(true)
    // Placeholder for animations - you can add these later
    // if (window.aboutPage_anime) {
    //   window.aboutPage_anime()
    // }
  }, [])

  return (
    <div className="flex flex-col h-full lg:flex-row-reverse items-center justify-center px-4 lg:px-[20%] py-8 gap-8 bg-white">
        
        {/* Left side - Text content */}
        <div className={`flex-1 min-w-[300px] transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <div className="border-l-4 border-gray-300 pl-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6 font-shippori">
              <span className="px-4 shadow-[inset_0_-15px_0_0_#96c8a2]">
                Hello World!
              </span>
            </h1>
            
            <div className="space-y-4 text-black text-base lg:text-lg leading-relaxed">
              <p>
                My name is Junho Choi and I am a 4th year Mechanical Engineering Undergraduate at Imperial College London. 
                Alongside my studies, I have been working as a Product Manager at DoubleMe since July 2020.
              </p>
              
              <p>
                Along with engineering, I have a keen interest in design, machine learning, front-end web development 
                and computer vision. These wide-ranging interests have led me to take part in a variety of projects 
                as part of my coursework, internships, and even individual projects that I have started in my free time.
              </p>
            </div>

            {/* Skills */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-black mb-3">Areas of Interest</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="border-green-400 text-black hover:bg-green-400/10">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Profile and achievements */}
        <div className={`flex-none w-full lg:w-[350px] transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Profile Image */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Image 
                src="/assets/JunhoChoi_profile2.jpeg" 
                alt="Profile pic"
                width={200}
                height={200}
                className="rounded-full border-4 border-green-400 shadow-lg"
                priority
              />
              <div className="absolute -inset-1 bg-gradient-to-br from-green-400 to-blue-400 rounded-full blur opacity-20" />
            </div>
          </div>

          {/* Achievements Cards */}
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <Card key={index} className="border-l-4 border-green-400 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="">
                  <h3 className="font-bold text-black mb-3 text-lg">
                    {achievement.institution}
                  </h3>
                  <Separator className="mb-3" />
                  <ul className="space-y-2">
                    {achievement.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700 text-sm flex items-start">
                        <span className="w-2 h-2 bg-green-400 rounded-full inline-block mt-2 mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    </div>
  )
}